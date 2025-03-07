import tensorflow as tf
import numpy as np

class PolicyValueNet3D(tf.keras.Model):
    def __init__(self, board_width=4, board_height=4, board_depth=4, l2_const=1e-4):
        super().__init__()
        self.board_width = board_width
        self.board_height = board_height
        self.board_depth = board_depth
        self.l2_const = l2_const
        
        # Common layers
        self.conv1 = tf.keras.layers.Conv3D(128, 3, padding="same", activation="relu",
                                          kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.conv2 = tf.keras.layers.Conv3D(128, 3, padding="same", activation="relu",
                                          kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.conv3 = tf.keras.layers.Conv3D(128, 3, padding="same", activation="relu",
                                          kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        
        # Batch normalization
        self.batch_norm1 = tf.keras.layers.BatchNormalization()
        self.batch_norm2 = tf.keras.layers.BatchNormalization()
        self.batch_norm3 = tf.keras.layers.BatchNormalization()
        
        # Policy head
        self.policy_conv = tf.keras.layers.Conv3D(4, 1, padding="same", activation="relu",
                                                kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.policy_flatten = tf.keras.layers.Flatten()
        self.policy_dropout = tf.keras.layers.Dropout(0.3)
        self.policy_fc = tf.keras.layers.Dense(board_width * board_height * board_depth,
                                             activation="softmax",
                                             kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        
        # Value head
        self.value_conv = tf.keras.layers.Conv3D(2, 1, padding="same", activation="relu",
                                               kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.value_flatten = tf.keras.layers.Flatten()
        self.value_dropout = tf.keras.layers.Dropout(0.3)
        self.value_fc1 = tf.keras.layers.Dense(64, activation="relu",
                                             kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        self.value_fc2 = tf.keras.layers.Dense(1, activation="tanh",
                                             kernel_regularizer=tf.keras.regularizers.l2(l2_const))
        
    def call(self, inputs):
        x = tf.transpose(inputs, [0, 2, 3, 4, 1])
        
        # Common layers with residual connections
        x = self.conv1(x)
        x = self.batch_norm1(x)
        residual = x
        
        x = self.conv2(x)
        x = self.batch_norm2(x)
        x = tf.keras.layers.add([x, residual])
        residual = x
        
        x = self.conv3(x)
        x = self.batch_norm3(x)
        x = tf.keras.layers.add([x, residual])
        
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

# Create model and load weights
model = PolicyValueNet3D()
dummy_input = tf.zeros((1, 4, 4, 4, 4))
_ = model(dummy_input)  # Build model
model.load_weights("/home/matt/Documents/gomoku_3d/alphazero/policy_3d_iter_125.weights.h5")

# Save as TensorFlow.js model
import tensorflowjs as tfjs
tfjs.converters.save_keras_model(model, "/home/matt/Documents/gomoku_3d/public/model")
