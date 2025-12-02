import { StyleSheet, TouchableOpacity, Button, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Configuration
const ROBOFLOW_MODEL = "billiard-balls-kjqyt-espxp/1";
const ROBOFLOW_API_KEY = "MYV5aBkAt7dqZz1fASwR";
const DETECTION_INTERVAL_MS = 2000; // 2 seconds to stay within free tier limits

export default function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<string>("No detection yet");
  const [detectedBalls, setDetectedBalls] = useState<number[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<any>(null);

  // Permissions check
  if (!permission) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleDetection = () => {
    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  };

  const startDetection = () => {
    setIsDetecting(true);
    // Immediate first run
    runDetectionCycle();
    // Start interval
    intervalRef.current = setInterval(runDetectionCycle, DETECTION_INTERVAL_MS);
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const runDetectionCycle = async () => {
    if (!cameraRef.current) return;

    try {
      // 1. Take picture
      // quality 0.5 and skipping creating a file can speed things up, but base64 is needed
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true, // skip android processing for speed
      });

      if (!photo || !photo.base64) {
        console.log("Failed to take photo or no base64");
        return;
      }

      // 2. Send to Roboflow
      await detectBalls(photo.base64);

    } catch (error) {
      console.error("Detection cycle error:", error);
      setLastResult(`Error: ${error}`);
    }
  };

  const detectBalls = async (base64Image: string) => {
    try {
      const response = await fetch(
        `https://detect.roboflow.com/${ROBOFLOW_MODEL}?api_key=${ROBOFLOW_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: base64Image,
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      processPredictions(data.predictions || []);

    } catch (error) {
      console.error("API Request failed:", error);
    }
  };

  const processPredictions = (predictions: any[]) => {
    const balls = new Set<number>();
    
    predictions.forEach((pred: any) => {
      if (pred.confidence < 0.5) return;

      const className = pred.class.toLowerCase();
      
      // Ignore cue ball for now
      if (className.includes("cue") || className.includes("white")) return;

      // Extract number
      const match = className.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 15) {
          balls.add(num);
        }
      }
    });

    const sortedBalls = Array.from(balls).sort((a, b) => a - b);
    setDetectedBalls(sortedBalls);
    setLastResult(`Found: ${sortedBalls.join(', ')}`);
    
    // Sync to Firebase
    syncToFirebase(sortedBalls);
  };

  const syncToFirebase = async (detectedBalls: number[]) => {
    try {
      // Use a single document ID "current" to always update the latest detection
      const detectionRef = doc(db, 'ball_detections', 'current');
      await setDoc(detectionRef, {
        detectedBalls: detectedBalls,
        timestamp: serverTimestamp(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log('✅ Synced to Firebase:', detectedBalls);
    } catch (error) {
      console.error('❌ Firebase sync error:', error);
      setLastResult(`Firebase Error: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back" 
        ref={cameraRef}
        animateShutter={false}
      >
        <View style={styles.overlay}>
          <View style={styles.statusPanel}>
            <Text style={styles.statusText}>
              Status: {isDetecting ? "🟢 DETECTING" : "🔴 PAUSED"}
            </Text>
            <Text style={styles.resultText}>
              {lastResult}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, isDetecting ? styles.buttonStop : styles.buttonStart]}
            onPress={toggleDetection}
          >
            <Text style={styles.buttonText}>
              {isDetecting ? "STOP" : "START"}
            </Text>
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
  text: {
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 20,
  },
  statusPanel: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultText: {
    color: '#00FF00',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  button: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#2196F3',
  },
  buttonStop: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
