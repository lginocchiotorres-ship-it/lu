import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { InspectionScreen } from './src/screens/InspectionScreen';

export default function App() {
  return (
    <>
      <InspectionScreen />
      <StatusBar style="light" />
    </>
  );
}
