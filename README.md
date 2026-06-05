# Drishti - NHAI Hackathon 🚀

Drishti is an offline-first, on-device facial recognition and personnel management application built with Expo and React Native. It was developed as a solution for the NHAI Hackathon, enabling seamless and secure verification of personnel even without an active internet connection.

## ✨ Features

- **Offline Mode**: Operates entirely offline. Records and logs are stored locally on the device and can be synced manually when connectivity is restored.
- **On-Device Facial Recognition**: Utilizes on-device AI models (`BlazeFace` for face detection and `MobileFaceNet` for face embeddings) via TensorFlow Lite to securely and quickly authenticate personnel without relying on cloud APIs.
- **Personnel Registration**: Add new personnel directly from the app, capturing their face data locally.
- **Verification Logs & History**: Keeps a detailed history of all authentication attempts (successes and rejections) with confidence scores.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Camera**: [`react-native-vision-camera`](https://react-native-vision-camera.com/)
- **Machine Learning**: [`react-native-fast-tflite`](https://github.com/mrousavy/react-native-fast-tflite) (TensorFlow Lite)
- **Local Storage**: `react-native-mmkv`
- **Routing**: Expo Router (File-based routing)

## 🚀 Getting Started

### Prerequisites

Since this project uses native modules (`react-native-vision-camera` and `react-native-fast-tflite`) that are not included in the standard Expo Go app, you will need to create a **Development Build** or compile the app locally using Android Studio / Xcode.

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

You can start the Expo development server by running:

```bash
npx expo start
```

### 3. Run on a Device

To run the app on your device, use the following commands to build the native app:

- **For Android:**
  ```bash
  npm run android
  ```
- **For iOS:**
  ```bash
  npm run ios
  ```

*(Note: iOS requires a Mac with Xcode installed. Running facial recognition models works best on a physical device rather than an emulator.)*

## 📁 Project Structure

- `src/app/` - Contains the screens and file-based routing logic (Expo Router).
  - `(tabs)/index.tsx` - Main dashboard.
  - `(tabs)/verify.tsx` - Real-time facial recognition and verification screen.
  - `(tabs)/register.tsx` - Screen for registering new personnel.
  - `(tabs)/history.tsx` - History and logs.
- `src/utils/` - Utility functions for face detection (BlazeFace), embeddings extraction, and similarity scoring.
- `src/storage/` - Local MMKV storage management for embeddings and logs.
- `assets/models/` - Contains the `.tflite` AI models used for on-device inference.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
