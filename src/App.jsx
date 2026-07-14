import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';

// Sample landscape image for live preview editing
const PREVIEW_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';

// Configurable range & stepping defaults for each parameter
const PARAM_CONFIGS = {
  // Basic Tab
  exposure: { label: 'Exposure', min: -4.0, max: 4.0, step: 0.1, default: 0, unit: ' EV', category: 'Basic' },
  contrast: { label: 'Contrast', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Basic' },
  highlights: { label: 'Highlights', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Basic' },
  shadows: { label: 'Shadows', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Basic' },
  whites: { label: 'Whites', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Basic' },
  blacks: { label: 'Blacks', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Basic' },
  vibrance: { label: 'Vibrance', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Basic' },
  saturation: { label: 'Saturation', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Basic' },

  // Color Tab
  temp: { label: 'Temp', min: 2000, max: 10000, step: 100, default: 5500, unit: ' K', category: 'Color' },
  tint: { label: 'Tint', min: -50, max: 50, step: 1, default: 0, unit: '', category: 'Color' },
  satRed: { label: 'Red Sat', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Color' },
  satGreen: { label: 'Green Sat', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Color' },
  satBlue: { label: 'Blue Sat', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Color' },
  hueRed: { label: 'Red Hue', min: -100, max: 100, step: 5, default: 0, unit: '°', category: 'Color' },
  hueGreen: { label: 'Green Hue', min: -100, max: 100, step: 5, default: 0, unit: '°', category: 'Color' },
  hueBlue: { label: 'Blue Hue', min: -100, max: 100, step: 5, default: 0, unit: '°', category: 'Color' },

  // Detail Tab
  clarity: { label: 'Clarity', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Detail' },
  dehaze: { label: 'Dehaze', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Detail' },
  vignette: { label: 'Vignette', min: -100, max: 100, step: 5, default: 0, unit: '%', category: 'Detail' },
  sharpness: { label: 'Sharpness', min: 0, max: 150, step: 10, default: 40, unit: '', category: 'Detail' },
  noiseReduction: { label: 'Noise Red.', min: 0, max: 100, step: 10, default: 0, unit: '', category: 'Detail' },
};

// Initial state builder
const getInitialParams = () => {
  const params = {};
  Object.keys(PARAM_CONFIGS).forEach(key => {
    params[key] = PARAM_CONFIGS[key].default;
  });
  return params;
};

export default function App() {
  // Application State
  const [params, setParams] = useState(getInitialParams());
  const [activeParam, setActiveParam] = useState('exposure');
  const [activeTab, setActiveTab] = useState('Basic'); // Basic, Color, Detail, Presets
  const [stepSize, setStepSize] = useState(null); // Will default to current config's step if null
  const [trackpadMode, setTrackpadMode] = useState('Tone'); // Tone, Color, Zoom
  const [trackpadCoords, setTrackpadCoords] = useState({ x: 50, y: 50 }); // percentage based
  const [trackpadSensitivity, setTrackpadSensitivity] = useState(1); // multiplier
  const [presetName, setPresetName] = useState('Default');

  // Trackpad references for click/drag tracking on web
  const trackpadRef = useRef(null);
  const isDraggingTrackpad = useRef(false);

  // Left Knob scrollwheel simulation / vertical drag reference
  const knobRef = useRef(null);
  const isDraggingKnob = useRef(false);
  const knobStartY = useRef(0);
  const knobStartValue = useRef(0);

  // Auto-set the custom step size if not overridden, or retrieve it
  const currentConfig = PARAM_CONFIGS[activeParam] || { min: 0, max: 100, step: 1, unit: '', label: '' };
  const currentStep = stepSize !== null ? stepSize : currentConfig.step;

  // Set preset combination profiles
  const applyPreset = (presetKey) => {
    setPresetName(presetKey);
    const updated = getInitialParams();

    if (presetKey === 'Cinematic') {
      updated.exposure = 0.2;
      updated.contrast = 25;
      updated.highlights = -30;
      updated.shadows = 40;
      updated.vignette = -45;
      updated.temp = 6200;
      updated.satBlue = -15;
      updated.satGreen = -30;
    } else if (presetKey === 'Moody Mono') {
      updated.exposure = -0.3;
      updated.contrast = 45;
      updated.whites = 15;
      updated.blacks = -25;
      updated.vibrance = -100;
      updated.saturation = -100;
      updated.vignette = -50;
      updated.clarity = 30;
    } else if (presetKey === 'Cyberpunk') {
      updated.exposure = 0.4;
      updated.contrast = 15;
      updated.temp = 3200;
      updated.tint = 35;
      updated.vibrance = 60;
      updated.satBlue = 50;
      updated.satRed = 40;
      updated.satGreen = -60;
      updated.vignette = -15;
    } else if (presetKey === 'Warm Vintage') {
      updated.exposure = -0.1;
      updated.contrast = -20;
      updated.temp = 7500;
      updated.tint = 10;
      updated.vignette = -60;
      updated.clarity = -15;
      updated.vibrance = -10;
    } else if (presetKey === 'Punchy Landscape') {
      updated.exposure = 0.1;
      updated.contrast = 15;
      updated.vibrance = 45;
      updated.satBlue = 20;
      updated.satGreen = 15;
      updated.dehaze = 25;
      updated.clarity = 15;
    }
    setParams(updated);
  };

  // Helper to clamp values in parameter ranges
  const clampValue = (val, key) => {
    const cfg = PARAM_CONFIGS[key];
    if (!cfg) return val;
    let clamped = Math.max(cfg.min, Math.min(cfg.max, val));
    // Round to step decimal places to avoid JS floating point bugs
    const decimals = (cfg.step.toString().split('.')[1] || '').length + 2;
    return parseFloat(clamped.toFixed(decimals));
  };

  // Adjust parameter by delta steps
  const adjustValue = (key, delta) => {
    setParams(prev => {
      const currentVal = prev[key];
      const newVal = clampValue(currentVal + delta, key);
      return { ...prev, [key]: newVal };
    });
    setPresetName('Custom');
  };

  // Reset current parameter
  const resetParam = (key) => {
    setParams(prev => ({
      ...prev,
      [key]: PARAM_CONFIGS[key].default
    }));
  };

  // Reset all parameters
  const resetAll = () => {
    setParams(getInitialParams());
    setPresetName('Default');
  };

  // Left Knob Mouse/Touch Interaction handler
  const handleKnobMouseDown = (e) => {
    isDraggingKnob.current = true;
    knobStartY.current = e.clientY || e.pageY;
    knobStartValue.current = params[activeParam];
    document.addEventListener('mousemove', handleKnobMouseMove);
    document.addEventListener('mouseup', handleKnobMouseUp);
  };

  const handleKnobMouseMove = (e) => {
    if (!isDraggingKnob.current) return;
    const currentY = e.clientY || e.pageY;
    const deltaY = knobStartY.current - currentY; // Upward drag = positive increase

    // Scale mapping: 1px drag = stepSize / 5
    // Make sure we have a reasonable scaling factor
    const scaleFactor = currentConfig.step * 0.2 * trackpadSensitivity;
    const deltaValue = deltaY * scaleFactor;

    setParams(prev => {
      const val = clampValue(knobStartValue.current + deltaValue, activeParam);
      return { ...prev, [activeParam]: val };
    });
    setPresetName('Custom');
  };

  const handleKnobMouseUp = () => {
    isDraggingKnob.current = false;
    document.removeEventListener('mousemove', handleKnobMouseMove);
    document.removeEventListener('mouseup', handleKnobMouseUp);
  };

  // Right Trackpad Mouse/Touch Interaction handler
  const updateTrackpadCoords = (clientX, clientY) => {
    if (!trackpadRef.current) return;
    const rect = trackpadRef.current.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Clamp coordinates to 0 - 100 %
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setTrackpadCoords({ x: Math.round(x), y: Math.round(y) });

    // Based on trackpadMode, map to parameter updates
    if (trackpadMode === 'Tone') {
      // X maps to Shadows (range -100 to 100), Y maps to Highlights (range -100 to 100)
      // Note: Y is usually inverted so dragging upwards increases highlight values
      const shadowVal = Math.round(((x / 50) - 1) * 100);
      const highlightVal = Math.round((1 - (y / 50)) * 100);

      setParams(prev => ({
        ...prev,
        shadows: clampValue(shadowVal, 'shadows'),
        highlights: clampValue(highlightVal, 'highlights')
      }));
    } else if (trackpadMode === 'Color') {
      // X maps to Temp (2000 to 10000), Y maps to Tint (-50 to 50)
      const tempVal = Math.round(2000 + (x / 100) * 8000);
      const tintVal = Math.round(((y / 50) - 1) * 50);

      setParams(prev => ({
        ...prev,
        temp: clampValue(tempVal, 'temp'),
        tint: clampValue(tintVal, 'tint')
      }));
    } else if (trackpadMode === 'Zoom') {
      // Zoom maps to vignette and exposure or vibrance dynamically
      const vignetteVal = Math.round(((x / 50) - 1) * 100);
      const exposureVal = parseFloat((((1 - (y / 50)) * 4.0)).toFixed(2));

      setParams(prev => ({
        ...prev,
        vignette: clampValue(vignetteVal, 'vignette'),
        exposure: clampValue(exposureVal, 'exposure')
      }));
    }
    setPresetName('Custom');
  };

  const handleTrackpadMouseDown = (e) => {
    isDraggingTrackpad.current = true;
    updateTrackpadCoords(e.clientX, e.clientY);
    document.addEventListener('mousemove', handleTrackpadMouseMove);
    document.addEventListener('mouseup', handleTrackpadMouseUp);
  };

  const handleTrackpadMouseMove = (e) => {
    if (!isDraggingTrackpad.current) return;
    updateTrackpadCoords(e.clientX, e.clientY);
  };

  const handleTrackpadMouseUp = () => {
    isDraggingTrackpad.current = false;
    document.removeEventListener('mousemove', handleTrackpadMouseMove);
    document.removeEventListener('mouseup', handleTrackpadMouseUp);
  };

  // Synchronize trackpad coordinates backwards when parameters change
  useEffect(() => {
    if (isDraggingTrackpad.current) return; // ignore feedback loop during active dragging

    if (trackpadMode === 'Tone') {
      // Shadows maps to X, Highlights maps to Y
      const x = ((params.shadows + 100) / 200) * 100;
      const y = (1 - (params.highlights + 100) / 200) * 100;
      setTrackpadCoords({ x: Math.round(x), y: Math.round(y) });
    } else if (trackpadMode === 'Color') {
      // Temp maps to X, Tint maps to Y
      const x = ((params.temp - 2000) / 8000) * 100;
      const y = ((params.tint + 50) / 100) * 100;
      setTrackpadCoords({ x: Math.round(x), y: Math.round(y) });
    } else if (trackpadMode === 'Zoom') {
      // Vignette maps to X, Exposure maps to Y
      const x = ((params.vignette + 100) / 200) * 100;
      const y = (1 - (params.exposure + 4.0) / 8.0) * 100;
      setTrackpadCoords({ x: Math.round(x), y: Math.round(y) });
    }
  }, [params.shadows, params.highlights, params.temp, params.tint, params.vignette, params.exposure, trackpadMode]);

  // Compute CSS filter styling for live preview image
  // exposure: -4 to 4 -> CSS brightness: 0% to 200% (default 100%)
  const brightness = 100 + (params.exposure * 25);
  // contrast: -100 to 100 -> CSS contrast: 0% to 200% (default 100%)
  const contrast = 100 + params.contrast;
  // saturation: -100 to 100 -> CSS saturate: 0% to 200% (default 100%)
  const saturation = 100 + params.saturation;
  // temp: 2000 to 10000 -> warm vs cool hue tint/sepia filters
  const tempShift = (params.temp - 5500) / 4500; // -0.77 to +1.0
  const sepia = tempShift > 0 ? tempShift * 50 : 0;
  const hueRotate = params.tint * 0.6; // subtle hue shifts
  const grayscale = params.saturation === -100 ? 100 : 0;

  // Custom Vignette effect overlay
  const vignetteRadius = 130 - Math.abs(params.vignette) * 0.7;
  const vignetteColor = params.vignette < 0 ? `rgba(0,0,0,${Math.abs(params.vignette) / 100})` : `rgba(255,255,255,${params.vignette / 120})`;

  const imageFilterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) hue-rotate(${hueRotate}deg) grayscale(${grayscale}%)`,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  // Filter params config keys based on category
  const getTabParams = () => {
    return Object.keys(PARAM_CONFIGS).filter(key => PARAM_CONFIGS[key].category === activeTab);
  };

  return (
    <View style={styles.container}>
      {/* Top Professional Lightroom Controller HUD Status Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>LUMINEX</Text>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>LIGHTROOM PRO</Text>
          </View>
        </View>

        <View style={styles.hudStats}>
          <Text style={styles.hudStatText}>
            Preset: <Text style={styles.hudStatHighlight}>{presetName}</Text>
          </Text>
          <View style={styles.hudDivider} />
          <Text style={styles.hudStatText}>
            Active: <Text style={styles.hudStatHighlight}>{currentConfig.label}</Text>
          </Text>
          <View style={styles.hudDivider} />
          <Text style={styles.hudStatText}>
            Value: <Text style={styles.hudStatHighlight}>{params[activeParam]}{currentConfig.unit}</Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.resetAllBtn} onPress={resetAll}>
          <Text style={styles.resetAllText}>RESET CONTROL</Text>
        </TouchableOpacity>
      </View>

      {/* Main Panel Content Area in Landscape */}
      <View style={styles.mainContent}>

        {/* ================= LEFT PANEL: VERTICAL KNOB CONTROLLER ================= */}
        <View style={styles.leftPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>KNOB CONTROLLER</Text>
            <Text style={styles.panelSubtitle}>DRAG OR USE BUTTONS</Text>
          </View>

          {/* Precision Stepping Configuration */}
          <View style={styles.stepSizeContainer}>
            <Text style={styles.stepLabel}>STEP SIZE</Text>
            <View style={styles.stepToggles}>
              {[0.01, 0.1, 1.0, 5.0, 10.0].map(sz => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.stepToggleBtn, currentStep === sz && styles.stepToggleBtnActive]}
                  onPress={() => setStepSize(sz)}
                >
                  <Text style={[styles.stepToggleText, currentStep === sz && styles.stepToggleTextActive]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interactive Virtual Cylinder Scroll Knob */}
          <View
            style={styles.knobViewport}
            onMouseDown={handleKnobMouseDown}
          >
            {/* Cylindrical lighting overlay effects */}
            <View style={styles.knobLightReflection} />

            {/* Value scale markings */}
            <View style={styles.knobTicksContainer}>
              {Array.from({ length: 15 }).map((_, i) => {
                const tickOffset = (i - 7) * 12;
                return (
                  <View
                    key={i}
                    style={[
                      styles.knobTick,
                      { transform: [{ translateY: tickOffset }] },
                      i === 7 && styles.knobTickCenter
                    ]}
                  />
                );
              })}
            </View>

            {/* Glowing grip bar following drag */}
            <View style={styles.knobGripBar} />

            <View style={styles.knobValueOverlay}>
              <Text style={styles.knobValueText}>
                {params[activeParam] > 0 ? `+${params[activeParam]}` : params[activeParam]}
              </Text>
              <Text style={styles.knobParamText}>{currentConfig.label}</Text>
            </View>
          </View>

          {/* Precise Stepping Increment Buttons (+ / -) */}
          <View style={styles.precisionControls}>
            <TouchableOpacity
              style={[styles.precisionBtn, styles.precisionBtnMinus]}
              onPress={() => adjustValue(activeParam, -currentStep)}
            >
              <Text style={styles.precisionBtnText}>-</Text>
              <Text style={styles.precisionBtnSub}>-{currentStep}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paramResetBtn}
              onPress={() => resetParam(activeParam)}
            >
              <Text style={styles.paramResetText}>ZERO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.precisionBtn, styles.precisionBtnPlus]}
              onPress={() => adjustValue(activeParam, currentStep)}
            >
              <Text style={styles.precisionBtnText}>+</Text>
              <Text style={styles.precisionBtnSub}>+{currentStep}</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* ================= CENTER PANEL: TABBED GRID & PREVIEW ================= */}
        <View style={styles.centerPanel}>
          {/* Central Tab selectors */}
          <View style={styles.tabBar}>
            {['Basic', 'Color', 'Detail', 'Presets'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Grid View & Live Photo Split */}
          <View style={styles.centerSplitView}>

            {/* Square Buttons Grid for Active Category */}
            <View style={styles.gridContainer}>
              <ScrollView contentContainerStyle={styles.gridScroll}>
                {activeTab !== 'Presets' ? (
                  <View style={styles.squareButtonsGrid}>
                    {getTabParams().map(key => {
                      const cfg = PARAM_CONFIGS[key];
                      const isActive = activeParam === key;
                      const hasChanged = params[key] !== cfg.default;

                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.squareBtn,
                            isActive && styles.squareBtnActive,
                            hasChanged && !isActive && styles.squareBtnModified
                          ]}
                          onPress={() => {
                            setActiveParam(key);
                            setStepSize(null); // fallback to parameter default step
                          }}
                        >
                          <Text style={[
                            styles.squareBtnIcon,
                            isActive && styles.squareBtnTextActive,
                            hasChanged && !isActive && styles.squareBtnTextModified
                          ]}>
                            {cfg.label.substring(0, 2).toUpperCase()}
                          </Text>
                          <Text style={[
                            styles.squareBtnLabel,
                            isActive && styles.squareBtnTextActive,
                            hasChanged && !isActive && styles.squareBtnTextModified
                          ]}>
                            {cfg.label}
                          </Text>
                          <Text style={[
                            styles.squareBtnValue,
                            isActive && styles.squareBtnValueActive,
                            hasChanged && !isActive && styles.squareBtnValueModified
                          ]}>
                            {params[key] > 0 && cfg.unit !== ' K' ? `+${params[key]}` : params[key]}{cfg.unit}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  // Presets Tab custom view
                  <View style={styles.squareButtonsGrid}>
                    {['Default', 'Cinematic', 'Moody Mono', 'Cyberpunk', 'Warm Vintage', 'Punchy Landscape'].map(presetKey => {
                      const isActive = presetName === presetKey;
                      return (
                        <TouchableOpacity
                          key={presetKey}
                          style={[styles.squareBtn, styles.presetBtnStyle, isActive && styles.squareBtnActive]}
                          onPress={() => applyPreset(presetKey)}
                        >
                          <View style={styles.presetColorDotContainer}>
                            <View style={[styles.presetColorDot, { backgroundColor: getPresetColor(presetKey) }]} />
                          </View>
                          <Text style={[styles.squareBtnLabel, isActive && styles.squareBtnTextActive, { marginTop: 4, textAlign: 'center' }]}>
                            {presetKey}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Live Interactive Photo Preview */}
            <View style={styles.photoPreviewContainer}>
              <View style={styles.photoLabelContainer}>
                <Text style={styles.photoLabel}>LIVE FEEDBACK ENGINE</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveIndicatorDot} />
                  <Text style={styles.liveIndicatorText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.imageViewport}>
                {/* Simulated CSS Filters */}
                <img
                  src={PREVIEW_IMAGE}
                  style={imageFilterStyle}
                  alt="Lightroom Landscape Edit Target"
                />

                {/* Simulated Vignette Ring */}
                <View style={[styles.vignetteOverlay, {
                  background: `radial-gradient(circle, transparent ${vignetteRadius}px, ${vignetteColor} 100%)`
                }]} pointerEvents="none" />
              </View>

              <View style={styles.photoFooter}>
                <Text style={styles.photoFooterText}>
                  ISO 100  ·  50mm  ·  f/2.8  ·  1/250s
                </Text>
              </View>
            </View>

          </View>
        </View>


        {/* ================= RIGHT PANEL: VIRTUAL TRACKPAD ================= */}
        <View style={styles.rightPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>VIRTUAL TRACKPAD</Text>
            <Text style={styles.panelSubtitle}>MULTI-AXIS CONTROLLERS</Text>
          </View>

          {/* Trackpad Mode Selectors */}
          <View style={styles.trackpadModes}>
            {[
              { id: 'Tone', title: 'TONE (SHD/HL)' },
              { id: 'Color', title: 'COLOR (TMP/TNT)' },
              { id: 'Zoom', title: 'FX (VIG/EXP)' },
            ].map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.trackpadModeBtn, trackpadMode === m.id && styles.trackpadModeBtnActive]}
                onPress={() => setTrackpadMode(m.id)}
              >
                <Text style={[styles.trackpadModeText, trackpadMode === m.id && styles.trackpadModeTextActive]}>
                  {m.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interactive Touchpad Area */}
          <View
            ref={trackpadRef}
            style={styles.trackpadArea}
            onMouseDown={handleTrackpadMouseDown}
          >
            {/* Grid Pattern Background */}
            <View style={styles.trackpadGridX1} />
            <View style={styles.trackpadGridX2} />
            <View style={styles.trackpadGridY1} />
            <View style={styles.trackpadGridY2} />
            <View style={styles.trackpadCenterTarget} />

            {/* Glowing Coordinate Indicator lines */}
            <View style={[styles.trackpadCrosshairX, { top: `${trackpadCoords.y}%` }]} />
            <View style={[styles.trackpadCrosshairY, { left: `${trackpadCoords.x}%` }]} />

            {/* Draggable Finger Glowing cursor */}
            <View style={[styles.trackpadCursor, { left: `${trackpadCoords.x}%`, top: `${trackpadCoords.y}%` }]}>
              <View style={styles.trackpadCursorGlow} />
            </View>

            {/* Live readout label corner */}
            <View style={styles.trackpadReadout}>
              <Text style={styles.trackpadReadoutText}>
                X: {trackpadCoords.x}%  |  Y: {100 - trackpadCoords.y}%
              </Text>
            </View>
          </View>

          {/* Sensitivity & reset controls */}
          <View style={styles.trackpadFooter}>
            <View style={styles.sensitivityContainer}>
              <Text style={styles.sensitivityLabel}>SENSITIVITY</Text>
              <View style={styles.sensitivityToggles}>
                {[0.5, 1.0, 1.5, 2.0].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sensitivityBtn, trackpadSensitivity === s && styles.sensitivityBtnActive]}
                    onPress={() => setTrackpadSensitivity(s)}
                  >
                    <Text style={[styles.sensitivityText, trackpadSensitivity === s && styles.sensitivityTextActive]}>
                      {s}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.trackpadResetBtn}
              onPress={() => {
                setTrackpadCoords({ x: 50, y: 50 });
                if (trackpadMode === 'Tone') {
                  setParams(p => ({ ...p, shadows: 0, highlights: 0 }));
                } else if (trackpadMode === 'Color') {
                  setParams(p => ({ ...p, temp: 5500, tint: 0 }));
                } else if (trackpadMode === 'Zoom') {
                  setParams(p => ({ ...p, vignette: 0, exposure: 0 }));
                }
              }}
            >
              <Text style={styles.trackpadResetBtnText}>CENTER AXIS</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}

// Preset color dots map
const getPresetColor = (key) => {
  switch (key) {
    case 'Default': return '#555555';
    case 'Cinematic': return '#e67e22';
    case 'Moody Mono': return '#95a5a6';
    case 'Cyberpunk': return '#9b59b6';
    case 'Warm Vintage': return '#f1c40f';
    case 'Punchy Landscape': return '#2ecc71';
    default: return '#555555';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    userSelect: 'none',
  },
  header: {
    height: 50,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandBadge: {
    backgroundColor: '#2e2e2e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  brandBadgeText: {
    color: '#00ccff',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hudStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#262626',
  },
  hudStatText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '500',
  },
  hudStatHighlight: {
    color: '#00ccff',
    fontWeight: 'bold',
  },
  hudDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#333333',
    marginHorizontal: 10,
  },
  resetAllBtn: {
    backgroundColor: '#b33939',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  resetAllText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    display: 'flex',
  },

  /* ================= LEFT PANEL STYLES ================= */
  leftPanel: {
    width: 240,
    backgroundColor: '#141414',
    borderRightWidth: 1,
    borderRightColor: '#222222',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    marginBottom: 10,
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  panelSubtitle: {
    color: '#555555',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  stepSizeContainer: {
    backgroundColor: '#1b1b1b',
    borderRadius: 6,
    padding: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  stepLabel: {
    color: '#777777',
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepToggles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepToggleBtn: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    marginHorizontal: 1,
    borderRadius: 3,
    backgroundColor: '#242424',
  },
  stepToggleBtnActive: {
    backgroundColor: '#00ccff',
  },
  stepToggleText: {
    color: '#aaaaaa',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stepToggleTextActive: {
    color: '#111111',
  },
  knobViewport: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'ns-resize',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobLightReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
  },
  knobTicksContainer: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 1,
    alignItems: 'center',
  },
  knobTick: {
    position: 'absolute',
    height: 1.5,
    width: '60%',
    backgroundColor: '#333333',
  },
  knobTickCenter: {
    backgroundColor: '#00ccff',
    height: 2.5,
    width: '80%',
    boxShadow: '0 0 5px #00ccff',
  },
  knobGripBar: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#00ccff',
    boxShadow: '0 0 8px #00ccff',
    top: '50%',
    transform: [{ translateY: -2 }],
    opacity: 0.8,
  },
  knobValueOverlay: {
    zIndex: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  knobValueText: {
    color: '#00ccff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 204, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  knobParamText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  precisionControls: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precisionBtn: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  precisionBtnMinus: {
    marginRight: 6,
  },
  precisionBtnPlus: {
    marginLeft: 6,
  },
  precisionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  precisionBtnSub: {
    color: '#666666',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 1,
  },
  paramResetBtn: {
    backgroundColor: '#1b1b1b',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  paramResetText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  /* ================= CENTER PANEL STYLES ================= */
  centerPanel: {
    flex: 1,
    backgroundColor: '#111111',
    display: 'flex',
    flexDirection: 'column',
    padding: 10,
    justifyContent: 'space-between',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333333',
  },
  tabBtnText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  centerSplitView: {
    flex: 1,
    flexDirection: 'column',
    display: 'flex',
  },
  gridContainer: {
    flex: 1,
    marginBottom: 8,
    maxHeight: '52%',
  },
  gridScroll: {
    flexGrow: 1,
  },
  squareButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 6,
    paddingBottom: 4,
  },
  squareBtn: {
    width: 'calc(25% - 5px)', // Perfect 4 per row layout on screen
    aspectRatio: 1,
    backgroundColor: '#181818',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  presetBtnStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareBtnActive: {
    backgroundColor: '#1a2c38',
    borderColor: '#00ccff',
    boxShadow: '0 0 10px rgba(0, 204, 255, 0.25)',
  },
  squareBtnModified: {
    borderColor: '#f39c12',
    backgroundColor: '#241f17',
  },
  squareBtnIcon: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  squareBtnLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  squareBtnValue: {
    color: '#aaaaaa',
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    backgroundColor: '#222222',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  squareBtnValueActive: {
    color: '#00ccff',
    backgroundColor: '#0f2430',
  },
  squareBtnValueModified: {
    color: '#f39c12',
    backgroundColor: '#2b2114',
  },
  squareBtnTextActive: {
    color: '#ffffff',
  },
  squareBtnTextModified: {
    color: '#f39c12',
  },
  presetColorDotContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  presetColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  /* Live Photo Preview Area */
  photoPreviewContainer: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  photoLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  photoLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1010',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#cc3333',
  },
  liveIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff3333',
    marginRight: 3,
    boxShadow: '0 0 4px #ff3333',
  },
  liveIndicatorText: {
    color: '#ff3333',
    fontSize: 7,
    fontWeight: '900',
  },
  imageViewport: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  vignetteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoFooter: {
    alignItems: 'center',
    marginTop: 4,
  },
  photoFooterText: {
    color: '#444444',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  /* ================= RIGHT PANEL STYLES ================= */
  rightPanel: {
    width: 250,
    backgroundColor: '#141414',
    borderLeftWidth: 1,
    borderLeftColor: '#222222',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  trackpadModes: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 10,
  },
  trackpadModeBtn: {
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  trackpadModeBtnActive: {
    backgroundColor: '#2a1a30',
    borderColor: '#a020f0',
    boxShadow: '0 0 6px rgba(160, 32, 240, 0.2)',
  },
  trackpadModeText: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  trackpadModeTextActive: {
    color: '#e0b0ff',
  },
  trackpadArea: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'crosshair',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
  },
  // Trackpad background grids
  trackpadGridX1: {
    position: 'absolute',
    left: '25%',
    width: 0.5,
    top: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  trackpadGridX2: {
    position: 'absolute',
    left: '75%',
    width: 0.5,
    top: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  trackpadGridY1: {
    position: 'absolute',
    top: '25%',
    height: 0.5,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
  },
  trackpadGridY2: {
    position: 'absolute',
    top: '75%',
    height: 0.5,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
  },
  trackpadCenterTarget: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  trackpadCrosshairX: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(160, 32, 240, 0.25)',
  },
  trackpadCrosshairY: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(160, 32, 240, 0.25)',
  },
  trackpadCursor: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#a020f0',
    transform: [{ translateX: -6 }, { translateY: -6 }],
    boxShadow: '0 0 8px #a020f0',
  },
  trackpadCursorGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(160, 32, 240, 0.15)',
  },
  trackpadReadout: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#333333',
  },
  trackpadReadoutText: {
    color: '#888888',
    fontSize: 7,
    fontWeight: 'bold',
  },
  trackpadFooter: {
    marginTop: 10,
    gap: 8,
  },
  sensitivityContainer: {
    backgroundColor: '#1b1b1b',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sensitivityLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  sensitivityToggles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensitivityBtn: {
    flex: 1,
    paddingVertical: 3,
    alignItems: 'center',
    marginHorizontal: 1,
    borderRadius: 3,
    backgroundColor: '#242424',
  },
  sensitivityBtnActive: {
    backgroundColor: '#a020f0',
  },
  sensitivityText: {
    color: '#888888',
    fontSize: 8,
    fontWeight: 'bold',
  },
  sensitivityTextActive: {
    color: '#ffffff',
  },
  trackpadResetBtn: {
    backgroundColor: '#262626',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  trackpadResetBtnText: {
    color: '#aaaaaa',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
