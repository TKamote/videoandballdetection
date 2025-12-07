import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- Roboflow Configuration ---
const ROBOFLOW_MODEL = "billiard-balls-kjqyt-espxp/1";
const ROBOFLOW_API_KEY = "MYV5aBkAt7dqZz1fASwR";
// ------------------------------

export default function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectedBalls, setDetectedBalls] = useState<string>('No detections yet.');
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleStreaming = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  const startStreaming = () => {
    setIsStreaming(true);
    // Immediate first run
    runDetectionCycle();
    // Start interval
    intervalRef.current = setInterval(runDetectionCycle, 2000);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const runDetectionCycle = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
      });

      if (photo?.base64) {
        await detectBalls(photo.base64);
      }
    } catch (error) {
      console.error("Detection cycle error:", error);
    }
  };

  const detectBalls = async (base64Image: string) => {
    try {
      const response = await fetch(
        `https://detect.roboflow.com/${ROBOFLOW_MODEL}?api_key=${ROBOFLOW_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: base64Image,
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      await processPredictions(data.predictions || []);

    } catch (error) {
      console.error("API Request failed:", error);
    }
  };

  const processPredictions = async (predictions: any[]) => {
    const balls = new Set<number>();
    
    predictions.forEach((pred: any) => {
      if (pred.confidence < 0.5) return;
      const className = pred.class.toLowerCase();
      if (className.includes("cue") || className.includes("white")) return;

      const match = className.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 15) {
          balls.add(num);
        }
      }
    });

    const sortedBalls = Array.from(balls).sort((a, b) => a - b);
    setDetectedBalls(`Detected: ${sortedBalls.join(', ')}`);
    
    // Sync to Firebase
    await syncToFirebase(sortedBalls);
  };

  const syncToFirebase = async (balls: number[]) => {
    try {
      const detectionRef = doc(db, 'ball_detections', 'current');
      await setDoc(detectionRef, {
        detectedBalls: balls,
        timestamp: serverTimestamp(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log('✅ Synced to Firebase:', balls);
    } catch (error) {
      console.error('❌ Firebase sync error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing='back' ref={cameraRef}>
        <View style={styles.detectionContainer}>
          <Text style={styles.detectionText}>{detectedBalls}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleStreaming}>
            <Text style={styles.text}>{isStreaming ? 'Stop' : 'Start'}</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  detectionContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  detectionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
