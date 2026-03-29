# import numpy as np
# import cv2
# from tensorflow.keras.models import load_model

# # Load trained model
# model = load_model("models/weights/Meso4_DF.h5")

# def preprocess_frame(image):
#     img = cv2.resize(image, (256, 256))
#     img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#     img = img.astype("float32") / 255.0
#     return img

# def predict_frames(images):
#     if not images:
#         return 0.5

#     processed = np.array([preprocess_frame(img) for img in images])

#     preds = model.predict(processed)

#     # Output is REAL probability
#     return float(np.mean(preds))

# import numpy as np
# import cv2
# from tensorflow.keras.layers import Input, Dense, Flatten, Conv2D, MaxPooling2D, BatchNormalization, Dropout, LeakyReLU
# from tensorflow.keras.models import Model

# # -------------------------------
# # Build MesoNet Architecture
# # -------------------------------
# def build_mesonet():
#     x = Input(shape=(256, 256, 3))

#     x1 = Conv2D(8, (3, 3), padding='same', activation='relu')(x)
#     x1 = BatchNormalization()(x1)
#     x1 = MaxPooling2D(pool_size=(2, 2), padding='same')(x1)

#     x2 = Conv2D(8, (5, 5), padding='same', activation='relu')(x1)
#     x2 = BatchNormalization()(x2)
#     x2 = MaxPooling2D(pool_size=(2, 2), padding='same')(x2)

#     x3 = Conv2D(16, (5, 5), padding='same', activation='relu')(x2)
#     x3 = BatchNormalization()(x3)
#     x3 = MaxPooling2D(pool_size=(2, 2), padding='same')(x3)

#     x4 = Conv2D(16, (5, 5), padding='same', activation='relu')(x3)
#     x4 = BatchNormalization()(x4)
#     x4 = MaxPooling2D(pool_size=(4, 4), padding='same')(x4)

#     y = Flatten()(x4)
#     y = Dropout(0.5)(y)
#     y = Dense(16)(y)
#     y = LeakyReLU(alpha=0.1)(y)
#     y = Dropout(0.5)(y)
#     y = Dense(1, activation='sigmoid')(y)

#     return Model(inputs=x, outputs=y)

# # -------------------------------
# # Load Model + Weights
# # -------------------------------
# model = build_mesonet()
# model.load_weights("models/weights/Meso4_DF.h5")  # ✅ correct

# print("✅ MesoNet weights loaded successfully")

# # -------------------------------
# # Preprocessing
# # -------------------------------
# def preprocess_frame(image):
#     img = cv2.resize(image, (256, 256))
#     img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#     img = img.astype(np.float32) / 255.0
#     return img

# -------------------------------
# Prediction
# -------------------------------
# def predict_frames(images):
#     if len(images) == 0:
#         return 0.5

#     processed = np.array([preprocess_frame(img) for img in images])

#     preds = model.predict(processed)

#     return float(np.mean(preds))  # real_confidence



import torch
import torchvision.models as models
import torchvision.transforms as transforms
import numpy as np
import cv2

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load ResNet
model = models.resnet18(pretrained=True)

model.fc = torch.nn.Sequential(
    torch.nn.Linear(model.fc.in_features, 1),
    torch.nn.Sigmoid()
)

model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def predict_frames(frames):
    preds = []

    for frame in frames:
        try:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = transform(frame).unsqueeze(0).to(device)

            with torch.no_grad():
                output = model(img)
                preds.append(output.item())

        except:
            continue

    if len(preds) == 0:
        return 0.5

    return float(np.mean(preds))



# import random

# # # # def predict_frames(frames):
# # # #     return random.random()







# # # import random

# # # def predict_frames(frames):
# # #     return random.random()

# import numpy as np
# import cv2
# import tensorflow as tf
# from tensorflow.keras.layers import Input, Dense, Flatten, Conv2D, MaxPooling2D, BatchNormalization, Dropout, LeakyReLU
# from tensorflow.keras.models import Model
# from tensorflow.keras.optimizers import Adam

# class Meso4:
#     def __init__(self, weights_path=None):
#         self.model = self.init_model()
#         if weights_path:
#             try:
#                 self.model.load_weights(weights_path)
#                 print(f"Weights loaded successfully from {weights_path}")
#             except Exception as e:
#                 print(f"Could not load weights: {e}. Model will use random initialization.")

#     def init_model(self):
#         """
#         Builds the Meso4 architecture.
#         """
#         x = Input(shape=(256, 256, 3))
        
#         # Block 1
#         x1 = Conv2D(8, (3, 3), padding='same', activation='relu')(x)
#         x1 = BatchNormalization()(x1)
#         x1 = MaxPooling2D(pool_size=(2, 2), padding='same')(x1)
        
#         # Block 2
#         x2 = Conv2D(8, (5, 5), padding='same', activation='relu')(x1)
#         x2 = BatchNormalization()(x2)
#         x2 = MaxPooling2D(pool_size=(2, 2), padding='same')(x2)
        
#         # Block 3
#         x3 = Conv2D(16, (5, 5), padding='same', activation='relu')(x2)
#         x3 = BatchNormalization()(x3)
#         x3 = MaxPooling2D(pool_size=(2, 2), padding='same')(x3)
        
#         # Block 4
#         x4 = Conv2D(16, (5, 5), padding='same', activation='relu')(x3)
#         x4 = BatchNormalization()(x4)
#         x4 = MaxPooling2D(pool_size=(4, 4), padding='same')(x4)
        
#         y = Flatten()(x4)
#         y = Dropout(0.5)(y)
#         y = Dense(16)(y)
#         y = LeakyReLU(alpha=0.1)(y)
#         y = Dropout(0.5)(y)
#         y = Dense(1, activation='sigmoid')(y)

#         return Model(inputs=x, outputs=y)

# # Initialize the model instance globally to avoid reloading for every request
# # Path should point to your downloaded .h5 file
# MODEL_WEIGHTS = "models/weights/Meso4_DF.h5"
# meso_model = Meso4(weights_path=MODEL_WEIGHTS)

# def preprocess_frame(image):
#     """
#     Standardizes the image for MesoNet:
#     1. Resize to 256x256
#     2. Convert BGR (OpenCV) to RGB
#     3. Rescale pixel values to [0, 1]
#     """
#     res = cv2.resize(image, (256, 256))
#     res = cv2.cvtColor(res, cv2.COLOR_BGR2RGB)
#     res = res.astype(np.float32) / 255.0
#     return res

# def predict_frames(images: list):
#     """
#     Predicts the average authenticity of multiple frames.
#     MesoNet Output: ~1.0 = Real/Authentic, ~0.0 = AI-Generated/Fake.
#     """
#     if not images or len(images) == 0:
#         return 0.5 # Neutral score if no frames

#     try:
#         processed_images = np.array([preprocess_frame(img) for img in images])
        
#         # verbose=0 keeps the FastAPI logs clean
#         predictions = meso_model.model.predict(processed_images, verbose=0)
        
#         # Calculate the mean across the 5 frames
#         avg_authenticity = np.mean(predictions)
        
#         return float(avg_authenticity)
#     except Exception as e:
#         print(f"Prediction Error: {e}")
#         return 0.0 # Return low trust on error

# # def predict_frames(images: list):
# #     """
# #     Predicts the average probability of being a deepfake across multiple frames.
# #     """
# #     if not images:
# #         return 0.0

# #     processed_images = np.array([preprocess_frame(img) for img in images])
    
# #     # Predict probabilities for the batch
# #     predictions = meso_model.model.predict(processed_images)
    
# #     # Return the mean probability across all frames
# #     # MesoNet outputs 1 for 'Real' and 0 for 'Fake' usually, 
# #     # but check your specific weights documentation. 
# #     # We'll return the raw average.
# #     avg_prob = np.mean(predictions)
    
# #     return avg_prob


# # import numpy as np
# # import cv2
# # import os
# # import tensorflow as tf
# # from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
# # from tensorflow.keras.models import Model
# # from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout

# # class ResNetDeepfake:
# #     def __init__(self, weights_path=None):
# #         self.model = self.init_model()
# #         if weights_path and os.path.exists(weights_path):
# #             try:
# #                 # We use by_name=True because often deepfake weights are saved 
# #                 # from a model that had a custom top layer
# #                 self.model.load_weights(weights_path, by_name=True)
# #                 print(f"ResNet50 Deepfake weights loaded from {weights_path}")
# #             except Exception as e:
# #                 print(f"Weight load error: {e}. Model is initialized with ImageNet weights.")
# #         else:
# #             print("No specific deepfake weights found. Using base ImageNet weights.")

# #     def init_model(self):
# #         """
# #         Loads ResNet50 with a custom head for binary classification (Real vs Fake).
# #         """
# #         # Load base ResNet50 without the top classification layer
# #         base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
        
# #         # Add custom layers for Deepfake detection
# #         x = base_model.output
# #         x = GlobalAveragePooling2D()(x)
# #         x = Dense(512, activation='relu')(x)
# #         x = Dropout(0.5)(x)
# #         predictions = Dense(1, activation='sigmoid')(x)
        
# #         model = Model(inputs=base_model.input, outputs=predictions)
# #         return model

# # # --- Global Initialization ---
# # # You will need to provide the path to your trained .h5 file here
# # # Common source: FaceForensics++ or DFDC pre-trained weights
# # MODEL_WEIGHTS = "models/weights/deepfake_detection_model.h5"
# # # WEIGHTS_PATH = os.path.join("models", "weights", "HumanityCheck/Backend/models/weights/deepfake_detection_model.h5")
# # resnet_instance = ResNetDeepfake(weights_path=MODEL_WEIGHTS)

# # def preprocess_frame(image):
# #     """
# #     Standard ResNet preprocessing:
# #     1. Resize to 224x224
# #     2. Convert BGR to RGB
# #     3. Apply ResNet-specific mean subtraction (preprocess_input)
# #     """
# #     try:
# #         # ResNet50 usually uses 224x224
# #         res = cv2.resize(image, (224, 224))
# #         res = cv2.cvtColor(res, cv2.COLOR_BGR2RGB)
        
# #         # Convert to float and apply ResNet's internal normalization
# #         # (This handles the mean subtraction and scaling automatically)
# #         res = np.expand_dims(res, axis=0)
# #         res = preprocess_input(res)
# #         return res[0]
# #     except Exception as e:
# #         print(f"Preprocessing error: {e}")
# #         return None

# # def predict_frames(images: list):
# #     """
# #     Takes list of OpenCV frames, returns average fake probability.
# #     """
# #     if not images:
# #         return 0.0

# #     processed_list = []
# #     for img in images:
# #         prep = preprocess_frame(img)
# #         if prep is not None:
# #             processed_list.append(prep)

# #     if not processed_list:
# #         return 0.0

# #     batch_input = np.array(processed_list)
    
# #     # Inference
# #     predictions = resnet_instance.model.predict(batch_input, verbose=0)
    
# #     # Average the scores. 
# #     # Logic: Closer to 1 = Fake, Closer to 0 = Real (standard for most DFDC ResNet models)
# #     avg_fake_prob = np.mean(predictions)
    
# #     return round(float(avg_fake_prob), 4)