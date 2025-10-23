import React, { useState, useEffect, useRef, useCallback } from 'react';
import { evaluate, compile } from 'mathjs';

interface Equation {
  id: number;
  expression: string;
  color: string;
  type: 'cartesian' | 'parametric' | 'polar' | 'shape';
  visible: boolean;
  parameter?: {
    min: number;
    max: number;
    step: number;
  };
}

type RangeType = 'x' | 'y';
type EquationType = 'cartesian' | 'parametric' | 'polar' | 'shape';

// Predefined shapes and functions
const PREDEFINED_GRAPHS: Record<string, {
  expression: string;
  type: string;
  parameter?: {
    min: number;
    max: number;
    step: number;
  }
}> = {
  circle: { expression: 'sqrt(r^2 - x^2)', type: 'cartesian' },
  sine: { expression: 'sin(x)', type: 'cartesian' },
  cosine: { expression: 'cos(x)', type: 'cartesian' },
  tangent: { expression: 'tan(x)', type: 'cartesian' },
  parabola: { expression: 'x^2', type: 'cartesian' },
  cubic: { expression: 'x^3', type: 'cartesian' },
  exponential: { expression: 'e^x', type: 'cartesian' },
  logarithm: { expression: 'log(x)', type: 'cartesian' },
  circleParametric: { 
    expression: '[r*cos(t), r*sin(t)]', 
    type: 'parametric',
    parameter: { min: 0, max: 2*Math.PI, step: 0.01 }
  },
  spiral: { 
    expression: '[t*cos(t), t*sin(t)]', 
    type: 'parametric',
    parameter: { min: 0, max: 10*Math.PI, step: 0.01 }
  },
  lissajous: { 
    expression: '[sin(a*t), sin(b*t)]', 
    type: 'parametric',
    parameter: { min: 0, max: 2*Math.PI, step: 0.01 }
  },
  cardioid: { 
    expression: '[r*(1+cos(t))*cos(t), r*(1+cos(t))*sin(t)]', 
    type: 'parametric',
    parameter: { min: 0, max: 2*Math.PI, step: 0.01 }
  },
  polarRose: { 
    expression: 'r*cos(n*theta)', 
    type: 'polar',
    parameter: { min: 0, max: 2*Math.PI, step: 0.01 }
  },
  polarSpiral: { 
    expression: 'a*theta', 
    type: 'polar',
    parameter: { min: 0, max: 10*Math.PI, step: 0.01 }
  }
};

const GraphPlotter: React.FC = () => {
  const [equation, setEquation] = useState<string>('x^2');
  const [xRange, setXRange] = useState<[number, number]>([-10, 10]);
  const [yRange, setYRange] = useState<[number, number]>([-10, 10]);
  const [error, setError] = useState<string>('');
  const [equations, setEquations] = useState<Equation[]>([
    { id: 1, expression: 'x^2', color: '#ff5555', type: 'cartesian', visible: true }
  ]);
  const [equationType, setEquationType] = useState<EquationType>('cartesian');
  const [parameterRange, setParameterRange] = useState<{ min: number; max: number; step: number }>({
    min: 0,
    max: 2 * Math.PI,
    step: 0.01
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customParameters, setCustomParameters] = useState<Record<string, number>>({
    r: 5,
    a: 2,
    b: 3,
    n: 3
  });
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number): void => {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    
    const xStep = width / 20;
    const yStep = height / 20;
    
    // Vertical grid lines
    for (let x = 0; x <= width; x += xStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= height; y += yStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  const drawAxes = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number): void => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // X-axis
    const yZero = height * (yRange[1] / (yRange[1] - yRange[0]));
    ctx.beginPath();
    ctx.moveTo(0, yZero);
    ctx.lineTo(width, yZero);
    ctx.stroke();
    
    // Y-axis
    const xZero = width * (-xRange[0] / (xRange[1] - xRange[0]));
    ctx.beginPath();
    ctx.moveTo(xZero, 0);
    ctx.lineTo(xZero, height);
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    
    // X-axis labels
    for (let x = Math.ceil(xRange[0]); x <= Math.floor(xRange[1]); x++) {
      if (x === 0) continue; // Skip zero as it's the origin
      const xPos = width * ((x - xRange[0]) / (xRange[1] - xRange[0]));
      ctx.fillText(x.toString(), xPos - 5, yZero + 15);
    }
    
    // Y-axis labels
    for (let y = Math.ceil(yRange[0]); y <= Math.floor(yRange[1]); y++) {
      if (y === 0) continue; // Skip zero as it's the origin
      const yPos = height * ((yRange[1] - y) / (yRange[1] - yRange[0]));
      ctx.fillText(y.toString(), xZero + 5, yPos + 5);
    }
    
    // Origin label
    ctx.fillText('0', xZero - 10, yZero + 15);
  }, [xRange, yRange]);

  // Convert canvas coordinates to graph coordinates
  const canvasToGraph = useCallback((x: number, y: number, width: number, height: number): [number, number] => {
    const graphX = xRange[0] + (x / width) * (xRange[1] - xRange[0]);
    const graphY = yRange[1] - (y / height) * (yRange[1] - yRange[0]);
    return [graphX, graphY];
  }, [xRange, yRange]);

  // Convert graph coordinates to canvas coordinates
  const graphToCanvas = useCallback((x: number, y: number, width: number, height: number): [number, number] => {
    const canvasX = width * ((x - xRange[0]) / (xRange[1] - xRange[0]));
    const canvasY = height * ((yRange[1] - y) / (yRange[1] - yRange[0]));
    return [canvasX, canvasY];
  }, [xRange, yRange]);

  // Draw a cartesian function y = f(x)
  const drawCartesianFunction = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    expression: string,
    color: string
  ): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let isFirstPoint = true;
    let lastY: number | null = null;
    
    try {
      const compiledExpression = compile(expression);
      const scope = { ...customParameters };
      
      for (let i = 0; i <= width; i += 1) {
        const [x] = canvasToGraph(i, 0, width, height);
        scope.x = x;
        
        try {
          const y = compiledExpression.evaluate(scope);
          
          if (y === null || !isFinite(y)) {
            isFirstPoint = true;
            continue;
          }
          
          const [, canvasY] = graphToCanvas(x, y, width, height);
          
          // Check for discontinuities
          if (lastY !== null && Math.abs(canvasY - lastY) > height / 4) {
            isFirstPoint = true;
          }
          
          if (canvasY < -1000 || canvasY > height + 1000) {
            isFirstPoint = true;
            continue;
          }
          
          if (isFirstPoint) {
            ctx.moveTo(i, canvasY);
            isFirstPoint = false;
          } else {
            ctx.lineTo(i, canvasY);
          }
          
          lastY = canvasY;
        } catch {
          isFirstPoint = true;
        }
      }
      
      ctx.stroke();
    } catch {
      console.error("Error drawing cartesian function");
    }
  }, [canvasToGraph, graphToCanvas, customParameters]);

  // Draw a parametric function [x(t), y(t)]
  const drawParametricFunction = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    expression: string,
    color: string,
    paramRange: { min: number; max: number; step: number }
  ): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let isFirstPoint = true;
    
    try {
      // Parse the expression which should return an array [x, y]
      const scope = { ...customParameters, t: 0 };
      
      for (let t = paramRange.min; t <= paramRange.max; t += paramRange.step) {
        scope.t = t;
        
        try {
          const result = evaluate(expression, scope);
          
          if (!Array.isArray(result) || result.length !== 2) {
            throw new Error("Parametric equation must return [x, y]");
          }
          
          const [x, y] = result;
          
          if (x === null || y === null || !isFinite(x) || !isFinite(y)) {
            isFirstPoint = true;
            continue;
          }
          
          const [canvasX, canvasY] = graphToCanvas(x, y, width, height);
          
          if (canvasX < -1000 || canvasX > width + 1000 || 
              canvasY < -1000 || canvasY > height + 1000) {
            isFirstPoint = true;
            continue;
          }
          
          if (isFirstPoint) {
            ctx.moveTo(canvasX, canvasY);
            isFirstPoint = false;
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        } catch {
          isFirstPoint = true;
        }
      }
      
      ctx.stroke();
    } catch {
      console.error("Error drawing parametric function");
    }
  }, [graphToCanvas, customParameters]);

  // Draw a polar function r = f(theta)
  const drawPolarFunction = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    expression: string,
    color: string,
    paramRange: { min: number; max: number; step: number }
  ): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let isFirstPoint = true;
    
    try {
      const compiledExpression = compile(expression);
      const scope = { ...customParameters };
      
      for (let theta = paramRange.min; theta <= paramRange.max; theta += paramRange.step) {
        scope.theta = theta;
        
        try {
          const r = compiledExpression.evaluate(scope);
          
          if (r === null || !isFinite(r)) {
            isFirstPoint = true;
            continue;
          }
          
          // Convert polar to cartesian
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          
          const [canvasX, canvasY] = graphToCanvas(x, y, width, height);
          
          if (canvasX < -1000 || canvasX > width + 1000 || 
              canvasY < -1000 || canvasY > height + 1000) {
            isFirstPoint = true;
            continue;
          }
          
          if (isFirstPoint) {
            ctx.moveTo(canvasX, canvasY);
            isFirstPoint = false;
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        } catch {
          isFirstPoint = true;
        }
      }
      
      ctx.stroke();
    } catch {
      console.error("Error drawing polar function");
    }
  }, [graphToCanvas, customParameters]);

  // Draw predefined shapes
  const drawShape = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    shapeName: string,
    color: string
  ): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 4;
    
    switch (shapeName.toLowerCase()) {
      case 'circle': {
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
        
      case 'square': {
        ctx.beginPath();
        ctx.rect(centerX - scale, centerY - scale, scale * 2, scale * 2);
        ctx.stroke();
        break;
      }
        
      case 'triangle': {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - scale);
        ctx.lineTo(centerX + scale, centerY + scale);
        ctx.lineTo(centerX - scale, centerY + scale);
        ctx.closePath();
        ctx.stroke();
        break;
      }
        
      case 'heart': {
                // Heart shape
                ctx.beginPath();
                const heartSize = scale * 0.8;
                ctx.moveTo(centerX, centerY + heartSize * 0.3);
                // Left curve
                ctx.bezierCurveTo(
                  centerX - heartSize, centerY, 
                  centerX - heartSize, centerY - heartSize, 
                  centerX, centerY - heartSize * 0.5
                );
                // Right curve
                ctx.bezierCurveTo(
                  centerX + heartSize, centerY - heartSize, 
                  centerX + heartSize, centerY, 
                  centerX, centerY + heartSize * 0.3
                );
                ctx.stroke();
                break;
              }
                
              case 'star': {
                ctx.beginPath();
                const starPoints = 5;
                const outerRadius = scale;
                const innerRadius = scale * 0.4;
                
                for (let i = 0; i < starPoints * 2; i++) {
                  const radius = i % 2 === 0 ? outerRadius : innerRadius;
                  const angle = (Math.PI / starPoints) * i;
                  const x = centerX + radius * Math.sin(angle);
                  const y = centerY - radius * Math.cos(angle);
                  
                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
                
                ctx.closePath();
                ctx.stroke();
                break;
              }
                
              default:
                console.error("Unknown shape:", shapeName);
            }
          }, []);
        
          const drawGraph = useCallback((): void => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const width = canvas.width;
            const height = canvas.height;
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Draw grid
            drawGrid(ctx, width, height);
            
            // Draw axes
            drawAxes(ctx, width, height);
            
            // Draw each equation
            equations.forEach(eq => {
              if (!eq.visible) return;
              
              try {
                switch (eq.type) {
                  case 'cartesian':
                    drawCartesianFunction(ctx, width, height, eq.expression, eq.color);
                    break;
                    
                  case 'parametric':
                    drawParametricFunction(
                      ctx, 
                      width, 
                      height, 
                      eq.expression, 
                      eq.color, 
                      eq.parameter || parameterRange
                    );
                    break;
                    
                  case 'polar':
                    drawPolarFunction(
                      ctx, 
                      width, 
                      height, 
                      eq.expression, 
                      eq.color, 
                      eq.parameter || parameterRange
                    );
                    break;
                    
                  case 'shape':
                    drawShape(ctx, width, height, eq.expression, eq.color);
                    break;
                    
                  default:
                    console.error("Unknown equation type:", eq.type);
                }
              } catch (err) {
                console.error("Error drawing equation", err);
              }
            });
          }, [
            equations, 
            drawGrid, 
            drawAxes, 
            drawCartesianFunction, 
            drawParametricFunction, 
            drawPolarFunction, 
            drawShape, 
            parameterRange
          ]);
        
          useEffect(() => {
            drawGraph();
          }, [drawGraph]);
        
          const handleAddEquation = (): void => {
            try {
              // Validate the equation based on its type
              if (equationType === 'cartesian') {
                // Test if the equation is valid
                compile(equation);
              } else if (equationType === 'parametric') {
                // For parametric, we expect an array [x, y]
                const testResult = evaluate(equation, { t: 0, ...customParameters });
                if (!Array.isArray(testResult) || testResult.length !== 2) {
                  throw new Error("Parametric equation must return [x, y]");
                }
              } else if (equationType === 'polar') {
                // Test if the polar equation is valid
                compile(equation);
              }
              
              const newId = equations.length > 0
                ? Math.max(...equations.map(eq => eq.id)) + 1
                : 1;
              
              const colors = ['#ff5555', '#55ff55', '#5555ff', '#ffff55', '#ff55ff', '#55ffff'];
              const newColor = colors[equations.length % colors.length];
              
              const newEquation: Equation = {
                id: newId,
                expression: equation,
                color: newColor,
                type: equationType,
                visible: true
              };
              
              if (equationType === 'parametric' || equationType === 'polar') {
                newEquation.parameter = { ...parameterRange };
              }
              
              setEquations([...equations, newEquation]);
              setEquation('');
              setError('');
            } catch (err) {
              if (err instanceof Error) {
                setError(err.message);
              } else {
                setError('Invalid equation');
              }
            }
          };
        
          const handleRemoveEquation = (id: number): void => {
            setEquations(equations.filter(eq => eq.id !== id));
          };
        
          const handleToggleVisibility = (id: number): void => {
            setEquations(equations.map(eq => 
              eq.id === id ? { ...eq, visible: !eq.visible } : eq
            ));
          };
        
          const handleRangeChange = (type: RangeType, index: number, value: string): void => {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return;
            
            if (type === 'x') {
              const newRange: [number, number] = [...xRange];
              newRange[index] = numValue;
              if (newRange[0] < newRange[1]) {
                setXRange(newRange);
              }
            } else {
              const newRange: [number, number] = [...yRange];
              newRange[index] = numValue;
              if (newRange[0] < newRange[1]) {
                setYRange(newRange);
              }
            }
          };
        
          const handleParameterRangeChange = (field: 'min' | 'max' | 'step', value: string): void => {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return;
            
            setParameterRange(prev => ({
              ...prev,
              [field]: numValue
            }));
          };
        
          const handleCustomParameterChange = (param: string, value: string): void => {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return;
            
            setCustomParameters(prev => ({
              ...prev,
              [param]: numValue
            }));
          };
        
          const handlePresetSelect = (preset: string): void => {
            setSelectedPreset(preset);
            
            if (preset && PREDEFINED_GRAPHS[preset]) {
              const presetData = PREDEFINED_GRAPHS[preset];
              setEquation(presetData.expression);
              setEquationType(presetData.type as EquationType);
              
              if (presetData.parameter) {
                setParameterRange(presetData.parameter);
              }
            }
          };
        
          const addPresetGraph = (): void => {
            if (!selectedPreset || !PREDEFINED_GRAPHS[selectedPreset]) return;
            
            const presetData = PREDEFINED_GRAPHS[selectedPreset];
            
            const newId = equations.length > 0
              ? Math.max(...equations.map(eq => eq.id)) + 1
              : 1;
            
            const colors = ['#ff5555', '#55ff55', '#5555ff', '#ffff55', '#ff55ff', '#55ffff'];
            const newColor = colors[equations.length % colors.length];
            
            const newEquation: Equation = {
              id: newId,
              expression: presetData.expression,
              color: newColor,
              type: presetData.type as EquationType,
              visible: true
            };
            
            if (presetData.parameter) {
              newEquation.parameter = { ...presetData.parameter };
            }
            
            setEquations([...equations, newEquation]);
            setSelectedPreset('');
          };
        
          return (
            <div className="space-y-4">
              <div className="bg-purple-900/20 rounded-2xl p-4">
                <h2 className="text-xl text-white font-bold mb-4">Advanced Graph Plotter</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-white text-sm block mb-1">Equation Type</label>
                    <select
                      value={equationType}
                      onChange={(e) => setEquationType(e.target.value as EquationType)}
                      className="w-full bg-purple-900/30 text-white p-2 rounded focus:outline-none"
                    >
                      <option value="cartesian">Cartesian (y = f(x))</option>
                      <option value="parametric">Parametric ([x(t), y(t)])</option>
                      <option value="polar">Polar (r = f(θ))</option>
                      <option value="shape">Predefined Shape</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white text-sm block mb-1">Predefined Graphs</label>
                    <div className="flex space-x-2">
                      <select
                        value={selectedPreset}
                        onChange={(e) => handlePresetSelect(e.target.value)}
                        className="flex-1 bg-purple-900/30 text-white p-2 rounded focus:outline-none"
                      >
                        <option value="">Select a preset</option>
                        <optgroup label="Cartesian">
                          <option value="circle">Circle</option>
                          <option value="sine">Sine</option>
                          <option value="cosine">Cosine</option>
                          <option value="tangent">Tangent</option>
                          <option value="parabola">Parabola</option>
                          <option value="cubic">Cubic</option>
                          <option value="exponential">Exponential</option>
                          <option value="logarithm">Logarithm</option>
                        </optgroup>
                        
                      </select>
                      <button
                        onClick={addPresetGraph}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        disabled={!selectedPreset}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={equation}
                    onChange={(e) => setEquation(e.target.value)}
                    placeholder={
                      equationType === 'cartesian' ? 'Enter equation (e.g., x^2)' :
                      equationType === 'parametric' ? 'Enter parametric equation (e.g., [cos(t), sin(t)])' :
                      equationType === 'polar' ? 'Enter polar equation (e.g., 2 + 2*cos(theta))' :
                      'Enter shape name (e.g., circle, square, triangle)'
                    }
                    className="flex-1 bg-purple-900/30 text-white p-2 rounded focus:outline-none"
                  />
                  <button
                    onClick={handleAddEquation}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                
                {error && (
                  <div className="text-red-400 text-sm mb-4 p-2 bg-red-900/20 rounded">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-white text-sm block mb-1">X Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={xRange[0]}
                        onChange={(e) => handleRangeChange('x', 0, e.target.value)}
                        className="w-20 bg-purple-900/30 text-white p-1 rounded focus:outline-none"
                      />
                      <span className="text-white">to</span>
                      <input
                        type="number"
                        value={xRange[1]}
                        onChange={(e) => handleRangeChange('x', 1, e.target.value)}
                        className="w-20 bg-purple-900/30 text-white p-1 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-white text-sm block mb-1">Y Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={yRange[0]}
                        onChange={(e) => handleRangeChange('y', 0, e.target.value)}
                        className="w-20 bg-purple-900/30 text-white p-1 rounded focus:outline-none"
                      />
                      <span className="text-white">to</span>
                      <input
                        type="number"
                        value={yRange[1]}
                        onChange={(e) => handleRangeChange('y', 1, e.target.value)}
                        className="w-20 bg-purple-900/30 text-white p-1 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                {(equationType === 'parametric' || equationType === 'polar') && (
                  <div className="mb-4 p-3 bg-purple-900/30 rounded">
                    <label className="text-white text-sm block mb-1">
                      {equationType === 'parametric' ? 'Parameter t Range' : 'Parameter θ Range'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-white text-xs">Min</label>
                        <input
                          type="number"
                          value={parameterRange.min}
                          onChange={(e) => handleParameterRangeChange('min', e.target.value)}
                          className="w-full bg-purple-900/50 text-white p-1 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-white text-xs">Max</label>
                        <input
                          type="number"
                          value={parameterRange.max}
                          onChange={(e) => handleParameterRangeChange('max', e.target.value)}
                          className="w-full bg-purple-900/50 text-white p-1 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-white text-xs">Step</label>
                        <input
                          type="number"
                          value={parameterRange.step}
                          step="0.001"
                          min="0.001"
                          onChange={(e) => handleParameterRangeChange('step', e.target.value)}
                          className="w-full bg-purple-900/50 text-white p-1 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4 p-3 bg-purple-900/30 rounded">
                  <label className="text-white text-sm block mb-1">Custom Parameters</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-white text-xs">r (radius)</label>
                      <input
                        type="number"
                        value={customParameters.r}
                        onChange={(e) => handleCustomParameterChange('r', e.target.value)}
                        className="w-full bg-purple-900/50 text-white p-1 rounded focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white text-xs">a</label>
                      <input
                        type="number"
                        value={customParameters.a}
                        onChange={(e) => handleCustomParameterChange('a', e.target.value)}
                        className="w-full bg-purple-900/50 text-white p-1 rounded focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white text-xs">b</label>
                      <input
                        type="number"
                        value={customParameters.b}
                        onChange={(e) => handleCustomParameterChange('b', e.target.value)}
                        className="w-full bg-purple-900/50 text-white p-1 rounded focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white text-xs">n (petals)</label>
                      <input
                        type="number"
                        value={customParameters.n}
                        onChange={(e) => handleCustomParameterChange('n', e.target.value)}
                        className="w-full bg-purple-900/50 text-white p-1 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-purple-900/10 rounded">
                  <h3 className="text-white text-sm font-medium sticky top-0 bg-purple-900/50 p-2 rounded">Active Graphs</h3>
                  {equations.length === 0 ? (
                    <div className="text-purple-300 text-center py-2">No graphs added yet</div>
                  ) : (
                    equations.map((eq) => (
                      <div key={eq.id} className="flex items-center space-x-2 p-2 bg-purple-900/30 rounded">
                        <button
                          onClick={() => handleToggleVisibility(eq.id)}
                          className={`w-4 h-4 rounded-full flex-shrink-0 ${eq.visible ? 'bg-green-500' : 'bg-red-500'}`}
                          title={eq.visible ? 'Hide' : 'Show'}
                        />
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: eq.color }} 
                        />
                        <div className="flex-1 text-white overflow-hidden text-ellipsis">
                          <span className="text-purple-300 text-xs mr-1">
                            {eq.type === 'cartesian' ? 'y =' : 
                             eq.type === 'parametric' ? '[x,y] =' : 
                             eq.type === 'polar' ? 'r =' : ''}
                          </span>
                          {eq.expression}
                        </div>
                        <div className="text-purple-300 text-xs flex-shrink-0">
                          {eq.type}
                        </div>
                        <button
                          onClick={() => handleRemoveEquation(eq.id)}
                          className="text-red-400 hover:text-red-300 flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full bg-purple-900/20 rounded-2xl"
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={() => drawGraph()}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="bg-purple-900/20 rounded-2xl p-4">
                <h3 className="text-white text-sm font-medium mb-2">Help & Examples</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-purple-200 text-sm">
                  <div>
                    <h4 className="text-white font-medium">Cartesian Functions</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Basic: <code>x^2</code>, <code>sin(x)</code></li>
                      <li>Combined: <code>x^2 + sin(x)</code></li>
                      <li>Piecewise: <code>x &lt; 0 ? -x : x^2</code></li>
                      <li>Circle: <code>sqrt(r^2 - x^2)</code> (upper half)</li>
                      <li>Hyperbola: <code>1/x</code></li>
                    </ul>
                  </div>
                  
                  
                </div>
                
                <div className="mt-4 text-purple-200 text-sm">
                  <h4 className="text-white font-medium">Available Functions & Constants</h4>
                  <p>
                    sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, log, log10, exp, sqrt, abs, floor, ceil, round, sign, 
                    pi, e, phi (golden ratio)
                  </p>
                </div>
              </div>
            </div>
          );
        };
        
        export default GraphPlotter;
                