import tensorflow as tf
import numpy as np

class PolicyValueNet3D(tf.keras.Model):
    def __init__(self, board_width, board_height, board_depth, l2_const=1e-4):
        super().__init__()
        self.board_width = board_width
        self.board_height = board_height
        self.board_depth = board_depth
        self.l2_const = l2_const

        # Common layers - reduced number of filters
        self.conv1 = tf.keras.layers.Conv3D(128, 3, padding='same', activation='relu',
                                          kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.conv2 = tf.keras.layers.Conv3D(128, 3, padding='same', activation='relu',
                                          kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.conv3 = tf.keras.layers.Conv3D(128, 3, padding='same', activation='relu',
                                          kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        
        # Batch normalization
        self.batch_norm1 = tf.keras.layers.BatchNormalization()
        self.batch_norm2 = tf.keras.layers.BatchNormalization()
        self.batch_norm3 = tf.keras.layers.BatchNormalization()
        
        # Policy head
        self.policy_conv = tf.keras.layers.Conv3D(4, 1, padding='same', activation='relu',
                                                kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.policy_flatten = tf.keras.layers.Flatten()
        self.policy_dropout = tf.keras.layers.Dropout(0.3)  # Add dropout for regularization
        self.policy_fc = tf.keras.layers.Dense(board_width * board_height * board_depth,
                                             activation='softmax',
                                             kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        
        # Value head
        self.value_conv = tf.keras.layers.Conv3D(2, 1, padding='same', activation='relu',
                                               kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.value_flatten = tf.keras.layers.Flatten()
        self.value_dropout = tf.keras.layers.Dropout(0.3)  # Add dropout for regularization
        self.value_fc1 = tf.keras.layers.Dense(64, activation='relu',
                                             kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.value_fc2 = tf.keras.layers.Dense(1, activation='tanh',
                                             kernel_regularizer=tf.keras.regularizers.l2(l2_const))

        # Compile with lower initial learning rate
        self.optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
        self.compile(optimizer=self.optimizer)

        # Initialize the model with a dummy input
        dummy_input = tf.zeros((1, 4, board_depth, board_height, board_width))
        self(dummy_input)

    def call(self, inputs):
        # Reshape input from (batch, channels, depth, height, width) to (batch, depth, height, width, channels)
        x = tf.transpose(inputs, [0, 2, 3, 4, 1])
        
        # Common layers with residual connections
        x = self.conv1(x)
        x = self.batch_norm1(x)
        residual = x
        
        x = self.conv2(x)
        x = self.batch_norm2(x)
        x = tf.keras.layers.add([x, residual])  # First residual connection
        residual = x
        
        x = self.conv3(x)
        x = self.batch_norm3(x)
        x = tf.keras.layers.add([x, residual])  # Second residual connection
        
        # Policy head
        policy = self.policy_conv(x)
        policy = self.policy_flatten(policy)
        policy = self.policy_dropout(policy)
        policy = self.policy_fc(policy)
        
        # Value head
        value = self.value_conv(x)
        value = self.value_flatten(value)
        value = self.value_dropout(value)
        value = self.value_fc1(value)
        value = self.value_fc2(value)
        
        return policy, value

    @tf.function
    def train_on_batch(self, state_batch, mcts_probs, winner_batch):
        """Train the model on a batch of data"""
        with tf.GradientTape() as tape:
            # Forward pass
            policy_out, value_out = self(state_batch)
            
            # Calculate loss using reduction=None to get per-example losses
            mse = tf.keras.losses.MeanSquaredError(reduction=tf.keras.losses.Reduction.NONE)
            cce = tf.keras.losses.CategoricalCrossentropy(reduction=tf.keras.losses.Reduction.NONE)
            
            value_loss = tf.reduce_mean(mse(winner_batch, tf.squeeze(value_out)))
            policy_loss = tf.reduce_mean(cce(mcts_probs, policy_out))
            total_loss = value_loss + policy_loss
            
            # Calculate entropy for monitoring
            entropy = tf.reduce_mean(cce(policy_out, policy_out))
        
        # Backward pass
        grads = tape.gradient(total_loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(grads, self.trainable_variables))
        
        return float(total_loss), float(entropy)

    def predict(self, state_batch):
        state_batch_tensor = tf.convert_to_tensor(state_batch, dtype=tf.float32)
        policy, value = self(state_batch_tensor)
        return policy.numpy(), value.numpy()

    def policy_value_fn(self, board):
        """Input: board state
           Output: probability of actions, state value"""
        legal_positions = board.availables
        current_state = np.ascontiguousarray(board.current_state().reshape(
            -1, 4, self.board_depth, self.board_height, self.board_width))
        
        action_probs, value = self.predict(current_state)
        act_probs = zip(legal_positions, action_probs[0][legal_positions])
        return act_probs, value[0][0]

    def policy_value(self, state_batch):
        """Input: a batch of states
           Output: a batch of action probabilities and state values"""
        return self.predict(state_batch)

    def save_model(self, model_path):
        """Save model weights"""
        self.save_weights(model_path)