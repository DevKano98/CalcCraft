import React, { useState, lazy, Suspense } from 'react';
import { evaluate } from 'mathjs';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import ErrorBoundary from '../ErrorBoundary';

// Component imports with type declarations
const GraphPlotter = lazy(() => import('./GraphPlotter'));
const MatrixCalculator = lazy(() => import('./MatrixCalculator'));
const EquationSolver = lazy(() => import('./EquationSolver'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

// Error fallback component
const ErrorFallback = (error: Error) => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-red-500">
    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
    <p className="text-sm mb-4">{error.message}</p>
    <button 
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
    >
      Try Again
    </button>
  </div>
);

type CalculatorMode = 'standard' | 'graph' | 'matrix' | 'equation';
type ButtonValue = string;

const ScientificCalculator: FC = () => {
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isRadian, setIsRadian] = useState<boolean>(true);
  const [mode, setMode] = useState<CalculatorMode>('standard');
  const [memory, setMemory] = useState<number | null>(null);
  
  const navigate = useNavigate();

  const handleCanvasClick = (): void => {
    navigate('/canvas');
  };

  const standardButtons: ButtonValue[][] = [
    ['Rad', 'Deg', '(', ')', '⌫'],
    ['sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'EXP', 'C'],
    ['sin', 'cos', 'tan', 'π', '√'],
    ['log', 'ln', 'x²', 'x³', '^'],
    ['7', '8', '9', '÷', 'M+'],
    ['4', '5', '6', '×', 'MR'],
    ['1', '2', '3', '-', 'HIS'],
    ['0', '.', '=', '+', 'ANS']
  ];

  const handleButtonClick = (value: ButtonValue): void => {
    let result: string | number;
    
    try {
      switch (value) {
        case 'C':
          setDisplay('0');
          setExpression('');
          break;
        case '⌫':
          if (display.length > 1) {
            setDisplay(display.slice(0, -1));
            setExpression(expression.slice(0, -1));
          } else {
            setDisplay('0');
            setExpression('');
          }
          break;
        case '=':
          result = calculateResult();
          setHistory([`${expression} = ${result}`, ...history.slice(0, 9)]);
          setDisplay(result.toString());
          setExpression(result.toString());
          break;
        case 'ANS':
          if (history.length > 0) {
            const lastResult = history[0].split(' = ')[1];
            setDisplay(lastResult);
            setExpression(lastResult);
          }
          break;
        case 'HIS':
          setShowHistory(!showHistory);
          break;
        case 'Rad':
        case 'Deg':
          setIsRadian(!isRadian);
          break;
        case 'M+':
          if (display !== 'Error') {
            const calcResult = calculateResult();
            if (typeof calcResult === 'number') {
              setMemory(calcResult);
            }
          }
          break;
        case 'MR':
          if (memory !== null) {
            setDisplay(memory.toString());
            setExpression(memory.toString());
          }
          break;
        case '×':
          updateExpression('*');
          break;
        case '÷':
          updateExpression('/');
          break;
        case 'π':
          updateExpression('pi');
          break;
        case 'EXP':
          updateExpression('e^');
          break;
        case 'x²':
          updateExpression('^2');
          break;
        case 'x³':
          updateExpression('^3');
          break;
        case 'sin':
        case 'cos':
        case 'tan':
          updateExpression(`${value}(${isRadian ? '' : 'pi/180*'}`);
          break;
        case 'sin⁻¹':
          updateExpression('asin(');
          break;
        case 'cos⁻¹':
          updateExpression('acos(');
          break;
        case 'tan⁻¹':
          updateExpression('atan(');
          break;
        case 'log':
          updateExpression('log10(');
          break;
        case 'ln':
          updateExpression('log(');
          break;
        case '√':
          updateExpression('sqrt(');
          break;
        default:
          updateExpression(value);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setDisplay('Error');
      setExpression('');
    }
  };

  const updateExpression = (value: string): void => {
    try {
      let newExpression = expression;
      
      // Handle special cases
      if (value === 'e^') {
        newExpression = expression === '0' ? 'e^(' : expression + 'e^(';
      } else if (value === '^2' || value === '^3') {
        newExpression = expression === '0' ? `(${value})` : `(${expression})${value}`;
      } else if (value === 'sqrt(' || value.startsWith('log') || value.startsWith('asin') || 
                 value.startsWith('acos') || value.startsWith('atan')) {
        newExpression = expression === '0' ? value : expression + value;
      } else {
        newExpression = expression === '0' ? value : expression + value;
      }

      setExpression(newExpression);
      setDisplay(newExpression);
    } catch (error) {
      console.error('Expression update error:', error);
      setDisplay('Error');
      setExpression('');
    }
  };

  const calculateResult = (): string | number => {
    try {
      if (!expression) return '0';
      
      let processedExpression = expression
        .replace(/ln/g, 'log')
        .replace(/π/g, 'pi')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/e\^/g, 'exp(')
        .replace(/\^2/g, '^2')
        .replace(/\^3/g, '^3');
      
      // Add closing parentheses for functions if needed
      if (processedExpression.includes('(') && !processedExpression.includes(')')) {
        processedExpression += ')';
      }
      
      const result = evaluate(processedExpression) as number;
      
      if (!Number.isFinite(result)) {
        throw new Error('Result is not a finite number');
      }
      
      return Number(result.toFixed(8));
    } catch (error) {
      console.error("Calculation error:", error);
      return 'Error';
    }
  };

  const renderCalculatorMode = (): JSX.Element => {
    switch (mode) {
      case 'graph':
        return (
          <ErrorBoundary fallback={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <GraphPlotter />
            </Suspense>
          </ErrorBoundary>
        );
      case 'matrix':
        return (
          <ErrorBoundary fallback={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <MatrixCalculator />
            </Suspense>
          </ErrorBoundary>
        );
      case 'equation':
        return (
          <ErrorBoundary fallback={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <EquationSolver />
            </Suspense>
          </ErrorBoundary>
        );
      case 'standard':
        return (
          <div>
            {/* Display Area */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-xl mb-6 border border-purple-900/20 shadow-inner">
              <div className="text-right text-sm text-purple-300 mb-2 min-h-[20px] font-mono">
                {expression || '0'}
              </div>
              <input
                type="text"
                value={display}
                readOnly
                className="w-full bg-transparent text-right text-4xl text-white font-mono focus:outline-none"
              />
            </div>

            {/* Calculator Buttons */}
            <div className="grid grid-cols-5 gap-3">
              {standardButtons.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {row.map((button) => (
                    <button
                      key={button}
                      onClick={() => handleButtonClick(button)}
                      className={`p-4 rounded-xl text-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                        ['C', '⌫', '÷', '×', '-', '+', '='].includes(button)
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : ['Rad', 'Deg', 'HIS', 'ANS', 'M+', 'MR'].includes(button)
                          ? 'bg-blue-600/50 text-white hover:bg-blue-600/70'
                          : 'bg-gray-700/50 text-white hover:bg-gray-700/70'
                      }`}
                    >
                      {button}
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* History Panel */}
            {showHistory && (
              <div className="mt-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-900/20 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-lg">History</h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-purple-300 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {history.map((item, index) => (
                    <div 
                      key={index} 
                      className="text-gray-300 text-sm font-mono bg-purple-900/20 p-3 rounded-lg hover:bg-purple-900/30 transition-colors cursor-pointer"
                      onClick={() => {
                        const result = item.split(' = ')[1];
                        setDisplay(result);
                        setExpression(result);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <div className="text-white text-center">Select a mode to begin</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Scientific Calculator</h1>
          <p className="text-purple-300 text-lg">Advanced calculations made simple</p>
        </div>

        {/* Mode Switching Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setMode('standard')}
            className={`group flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              mode === 'standard' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-purple-600/20 text-white hover:bg-purple-600/30 hover:shadow-md backdrop-blur-sm'
            }`}
          >
            <span className="font-medium">Standard</span>
          </button>
          <button
            onClick={() => setMode('graph')}
            className={`group flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              mode === 'graph' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-purple-600/20 text-white hover:bg-purple-600/30 hover:shadow-md backdrop-blur-sm'
            }`}
          >
            <span className="font-medium">Graph</span>
          </button>
          <button
            onClick={() => setMode('matrix')}
            className={`group flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              mode === 'matrix' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-purple-600/20 text-white hover:bg-purple-600/30 hover:shadow-md backdrop-blur-sm'
            }`}
          >
            <span className="font-medium">Matrix</span>
          </button>
          <button
            onClick={() => setMode('equation')}
            className={`group flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              mode === 'equation' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-purple-600/20 text-white hover:bg-purple-600/30 hover:shadow-md backdrop-blur-sm'
            }`}
          >
            <span className="font-medium">Equation</span>
          </button>
          <button
            onClick={handleCanvasClick}
            className="group flex items-center space-x-2 px-6 py-3 rounded-xl bg-purple-600/20 text-white hover:bg-purple-600/30 hover:shadow-md backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
          >
            <span className="font-medium">Canvas</span>
          </button>
        </div>

        {/* Calculator Container */}
        <div className="bg-purple-900/20 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
          {renderCalculatorMode()}
        </div>
      </div>
    </div>
  );
};

export default ScientificCalculator; 