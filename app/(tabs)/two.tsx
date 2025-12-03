import { StyleSheet, ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function TabTwoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>About Pool Vision AI</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.paragraph}>
          Welcome to Pool Vision AI, your advanced billiards and pool game analyzer. Using state-of-the-art computer vision technology, this app allows you to capture video of your games and receive precise ball detection and trajectory analysis. Enhance your training, review your shots, and take your skills to the next level.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <Text style={styles.bulletPoint}>• Accurate Ball Detection: Our AI model is trained to identify and track every ball on the table with high precision.</Text>
        <Text style={styles.bulletPoint}>• Shot Analysis: Review captured videos to see the paths of the cue ball and object balls.</Text>
        <Text style={styles.bulletPoint}>• Simple Interface: Easily record and manage your videos directly from your device.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Use</Text>
        <Text style={styles.paragraph}>
          1. Navigate to the <Text style={styles.bold}>Capture</Text> tab.
          {'\n'}
          2. Record a video of your pool shot or game.
          {'\n'}
          3. Our software will process the video to detect the balls and their movements.
          {'\n'}
          4. Review the analysis to improve your gameplay.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
});
