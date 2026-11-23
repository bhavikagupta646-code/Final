"use client";

import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { portalConfig } from "../../config/portalConfig";
import { apiClient } from "../../lib/apiClient";

interface ECGShieldLoaderProps {
  onFinish?: () => void;
}

const MESSAGES = [
  "Securing your healthcare environment",
  "Initializing privacy protection",
  "Verifying secure connection",
  "Preparing your dashboard",
  "Welcome to HealthShield",
];

export const ECGShieldLoader: React.FC<ECGShieldLoaderProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Check if user already saw the loader in this session
    if (typeof window !== "undefined") {
      const alreadyLoaded = sessionStorage.getItem("hs_loaded") === "true";
      if (alreadyLoaded && !portalConfig.enableLoaderOnReturnVisit) {
        setIsVisible(false);
        if (onFinish) onFinish();
        return;
      }
    }

    // Ping health in background
    apiClient.checkHealth().catch(() => {});

    const startTime = Date.now();
    const minDurationMs = 1200;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.floor(Math.random() * 8) + 6, 100);
        const idx = Math.min(Math.floor(next / 22), MESSAGES.length - 1);
        setMessageIndex(idx);

        if (next >= 100) {
          clearInterval(interval);
          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, minDurationMs - elapsed);

          setTimeout(() => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("hs_loaded", "true");
            }
            setIsVisible(false);
            setTimeout(() => {
              if (onFinish) onFinish();
            }, 600);
          }, remainingDelay + 250);
        }
        return next;
      });
    }, 75);

    return () => clearInterval(interval);
  }, [onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`hs-loader-overlay ${progress >= 100 ? "hs-loader-hidden" : ""}`}
      aria-label="HealthShield Security Initializer"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="hs-ecg-shield-box">
        <div className="hs-shield-pulse-ring" />
        <Shield className="w-16 h-16 text-teal-300 drop-shadow-md z-10" />

        {/* ECG Polyline SVG Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          viewBox="0 0 140 140"
          fill="none"
        >
          <path
            className="hs-ecg-path"
            d="M 15 70 L 45 70 L 55 45 L 65 95 L 75 35 L 85 105 L 95 70 L 125 70"
            stroke="#5eead4"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="text-xl font-bold tracking-tight text-white mb-1">
        Health<span className="text-teal-400">Shield</span>
      </div>

      <div className="hs-loader-progress-wrap">
        <div
          className="hs-loader-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between w-64 text-xs font-semibold px-1">
        <span className="hs-loader-text">{MESSAGES[messageIndex]}</span>
        <span className="hs-loader-percent">{String(progress).padStart(2, "0")}%</span>
      </div>
    </div>
  );
};
