import h5py
import json
import numpy as np

# Layer name mapping from Python to JS
layer_mapping = {
    'conv1': ['conv1/kernel:0', 'conv1/bias:0'],
    'conv2': ['conv2/kernel:0', 'conv2/bias:0'],
    'conv3': ['conv3/kernel:0', 'conv3/bias:0'],
    'batch_norm1': ['batch_normalization/gamma:0', 'batch_normalization/beta:0', 'batch_normalization/moving_mean:0', 'batch_normalization/moving_variance:0'],
    'batch_norm2': ['batch_normalization_1/gamma:0', 'batch_normalization_1/beta:0', 'batch_normalization_1/moving_mean:0', 'batch_normalization_1/moving_variance:0'],
    'batch_norm3': ['batch_normalization_2/gamma:0', 'batch_normalization_2/beta:0', 'batch_normalization_2/moving_mean:0', 'batch_normalization_2/moving_variance:0'],
    'policy_conv': ['policy_conv/kernel:0', 'policy_conv/bias:0'],
    'policy_fc': ['policy_fc/kernel:0', 'policy_fc/bias:0'],
    'value_conv': ['value_conv/kernel:0', 'value_conv/bias:0'],
    'value_fc1': ['value_fc1/kernel:0', 'value_fc1/bias:0'],
    'value_fc2': ['value_fc2/kernel:0', 'value_fc2/bias:0']
}

weights_dict = {}

# Load weights from h5 file
with h5py.File('alphazero/policy_3d_iter_125.weights.h5', 'r') as f:
    # Group weights by our layer names
    for js_name, h5_names in layer_mapping.items():
        layer_weights = []
        for weight_name in h5_names:
            if weight_name in f:
                # Convert to correct format and handle transposes if needed
                weight_data = np.array(f[weight_name])
                if 'kernel' in weight_name and 'conv' in js_name:
                    # Conv kernels need to be transposed for TF.js format
                    weight_data = np.transpose(weight_data, (4, 0, 1, 2, 3))
                elif 'kernel' in weight_name and 'fc' in js_name:
                    # Dense layers need to be transposed
                    weight_data = np.transpose(weight_data)
                layer_weights.append(weight_data.tolist())
        weights_dict[js_name] = layer_weights

# Save to JSON
with open('public/model_weights.json', 'w') as f:
    json.dump(weights_dict, f)
