import * as tf from '@tensorflow/tfjs';

export class PolicyValueNet {
  private boardWidth: number;
  private boardHeight: number;
  private boardDepth: number;
  private l2_const: number = 1e-4;
  
  // Layers
  private conv1: tf.layers.Layer;
  private conv2: tf.layers.Layer;
  private conv3: tf.layers.Layer;
  private batchNorm1: tf.layers.Layer;
  private batchNorm2: tf.layers.Layer;
  private batchNorm3: tf.layers.Layer;
  private policyConv: tf.layers.Layer;
  private policyFlatten: tf.layers.Layer;
  private policyDropout: tf.layers.Layer;
  private policyFC: tf.layers.Layer;
  private valueConv: tf.layers.Layer;
  private valueFlatten: tf.layers.Layer;
  private valueDropout: tf.layers.Layer;
  private valueFC1: tf.layers.Layer;
  private valueFC2: tf.layers.Layer;

  constructor(boardWidth: number, boardHeight: number, boardDepth: number) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
    this.boardDepth = boardDepth;

    // Initialize layers
    this.conv1 = tf.layers.conv3d({
      filters: 128,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });

    this.conv2 = tf.layers.conv3d({
      filters: 128,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });

    this.conv3 = tf.layers.conv3d({
      filters: 128,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });

    this.batchNorm1 = tf.layers.batchNormalization();
    this.batchNorm2 = tf.layers.batchNormalization();
    this.batchNorm3 = tf.layers.batchNormalization();

    this.policyConv = tf.layers.conv3d({
      filters: 4,
      kernelSize: 1,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });

    this.policyFlatten = tf.layers.flatten();
    this.policyDropout = tf.layers.dropout({ rate: 0.3 });
    this.policyFC = tf.layers.dense({
      units: boardWidth * boardHeight * boardDepth,
      activation: 'softmax',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });

    this.valueConv = tf.layers.conv3d({
      filters: 2,
      kernelSize: 1,
      padding: 'same',
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });

    this.valueFlatten = tf.layers.flatten();
    this.valueDropout = tf.layers.dropout({ rate: 0.3 });
    this.valueFC1 = tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });
    this.valueFC2 = tf.layers.dense({
      units: 1,
      activation: 'tanh',
      kernelRegularizer: tf.regularizers.l2({ l2: this.l2_const })
    });
  }

  async loadWeights(weightsPath: string) {
    const response = await fetch(weightsPath);
    const weights = await response.json();
    
    // Set weights for each layer
    const setLayerWeights = async (layer: tf.layers.Layer, name: string) => {
      if (weights[name]) {
        await layer.setWeights(weights[name].map((w: number[]) => tf.tensor(w)));
      }
    };

    await setLayerWeights(this.conv1, 'conv1');
    await setLayerWeights(this.conv2, 'conv2');
    await setLayerWeights(this.conv3, 'conv3');
    await setLayerWeights(this.batchNorm1, 'batch_norm1');
    await setLayerWeights(this.batchNorm2, 'batch_norm2');
    await setLayerWeights(this.batchNorm3, 'batch_norm3');
    await setLayerWeights(this.policyConv, 'policy_conv');
    await setLayerWeights(this.policyFC, 'policy_fc');
    await setLayerWeights(this.valueConv, 'value_conv');
    await setLayerWeights(this.valueFC1, 'value_fc1');
    await setLayerWeights(this.valueFC2, 'value_fc2');
  }

  async predict(state: number[][][][]): Promise<[Float32Array, number]> {
    // Convert input to tensor and reshape
    const inputTensor = tf.tidy(() => {
      const input = tf.tensor5d(state, [1, 4, this.boardDepth, this.boardHeight, this.boardWidth]);
      const transposed = tf.transpose(input, [0, 2, 3, 4, 1]);
      
      // Forward pass through the network
      let x = this.conv1.apply(transposed) as tf.Tensor;
      x = this.batchNorm1.apply(x) as tf.Tensor;
      const residual1 = x;

      x = this.conv2.apply(x) as tf.Tensor;
      x = this.batchNorm2.apply(x) as tf.Tensor;
      x = tf.add(x, residual1);
      const residual2 = x;

      x = this.conv3.apply(x) as tf.Tensor;
      x = this.batchNorm3.apply(x) as tf.Tensor;
      x = tf.add(x, residual2);

      // Policy head
      let policy = this.policyConv.apply(x) as tf.Tensor;
      policy = this.policyFlatten.apply(policy) as tf.Tensor;
      policy = this.policyDropout.apply(policy) as tf.Tensor;
      policy = this.policyFC.apply(policy) as tf.Tensor;

      // Value head
      let value = this.valueConv.apply(x) as tf.Tensor;
      value = this.valueFlatten.apply(value) as tf.Tensor;
      value = this.valueDropout.apply(value) as tf.Tensor;
      value = this.valueFC1.apply(value) as tf.Tensor;
      value = this.valueFC2.apply(value) as tf.Tensor;

      return [policy, value];
    });

    // Convert predictions to required format
    const [policyTensor, valueTensor] = inputTensor;
    const policyProbs = await policyTensor.data() as Float32Array;
    const value = (await valueTensor.data())[0];

    // Clean up tensors
    tf.dispose([policyTensor, valueTensor]);

    return [policyProbs, value];
  }
}