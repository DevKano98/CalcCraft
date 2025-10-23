import React, { useState } from 'react';
import { matrix as createMatrix, det, inv, transpose, add, subtract, multiply, Matrix } from 'mathjs';

type MatrixType = number[][];

interface Dimensions {
  rows: number;
  cols: number;
}

const MatrixCalculator: React.FC = () => {
  const [matrixA, setMatrixA] = useState<MatrixType>([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]);
  const [matrixB, setMatrixB] = useState<MatrixType>([
    [9, 8, 7],
    [6, 5, 4],
    [3, 2, 1]
  ]);
  const [result, setResult] = useState<MatrixType | string | null>(null);
  const [operation, setOperation] = useState<string>('add');
  const [dimensions, setDimensions] = useState<Dimensions>({ rows: 3, cols: 3 });
  const [error, setError] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');

  const handleMatrixChange = (matrix: MatrixType, row: number, col: number, value: string): MatrixType => {
    const numValue = value === '' ? 0 : Number(value);
    if (isNaN(numValue)) return matrix; // Return original matrix if input is invalid
    
    const newMatrix = matrix.map(row => [...row]); // Create deep copy
    newMatrix[row][col] = numValue;
    return newMatrix;
  };

  const handleMatrixAChange = (row: number, col: number, value: string): void => {
    setMatrixA(handleMatrixChange(matrixA, row, col, value));
  };

  const handleMatrixBChange = (row: number, col: number, value: string): void => {
    setMatrixB(handleMatrixChange(matrixB, row, col, value));
  };

  const handleDimensionChange = (type: keyof Dimensions, value: string): void => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1 || numValue > 5) {
      setError('Dimensions must be between 1 and 5');
      return;
    }
    
    const newDimensions = { ...dimensions, [type]: numValue };
    setDimensions(newDimensions);
    setError('');
    
    // Resize matrices
    const resizeMatrix = (matrix: MatrixType, rows: number, cols: number): MatrixType => {
      return Array(rows).fill(0).map((_, i) => 
        Array(cols).fill(0).map((_, j) => 
          i < matrix.length && j < matrix[0].length ? matrix[i][j] : 0
        )
      );
    };

    setMatrixA(resizeMatrix(matrixA, newDimensions.rows, newDimensions.cols));
    setMatrixB(resizeMatrix(matrixB, newDimensions.rows, newDimensions.cols));
    setResult(null);
    setExplanation('');
  };

  const validateMatrices = (operation: string): boolean => {
    // Reset previous error
    setError('');

    // Validate dimensions for different operations
    switch (operation) {
      case 'add':
      case 'subtract':
        if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
          setError('Matrices must have the same dimensions for addition/subtraction');
          return false;
        }
        break;
      case 'multiply':
        if (matrixA[0].length !== matrixB.length) {
          setError('Number of columns in Matrix A must equal number of rows in Matrix B for multiplication');
          return false;
        }
        break;
      case 'determinantA':
      case 'inverseA':
        if (!isSquareMatrix(matrixA)) {
          setError('Matrix A must be square for this operation');
          return false;
        }
        break;
      case 'determinantB':
      case 'inverseB':
        if (!isSquareMatrix(matrixB)) {
          setError('Matrix B must be square for this operation');
          return false;
        }
        break;
    }
    return true;
  };

  const isSquareMatrix = (matrix: MatrixType): boolean => {
    return matrix.length === matrix[0].length;
  };

  const calculateDeterminant = (matrix: MatrixType, label: string): void => {
    if (!validateMatrices(`determinant${label}`)) {
      setResult(null);
      setExplanation('');
      return;
    }
    
    try {
      const mathMatrix = createMatrix(matrix);
      const determinant = det(mathMatrix);
      const formattedDeterminant = Math.abs(determinant) < 1e-10 ? 0 : determinant;
      
      setResult(`Determinant of ${label}: ${formattedDeterminant.toFixed(4)}`);
      
      let explanation = `The determinant of matrix ${label} is ${formattedDeterminant.toFixed(4)}.\n`;
      if (Math.abs(formattedDeterminant) < 1e-10) {
        explanation += "This matrix is singular (determinant = 0), which means it's not invertible.";
      } else {
        explanation += `This non-zero determinant indicates that matrix ${label} is invertible.`;
      }
      
      setExplanation(explanation);
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unknown error occurred');
    }
    setResult(null);
    setExplanation('');
  };

  const calculateResult = (): void => {
    if (!validateMatrices(operation)) return;

    try {
      const mathMatrixA = createMatrix(matrixA);
      const mathMatrixB = createMatrix(matrixB);
      
      let resultMatrix: Matrix | number;
      
      switch (operation) {
        case 'add':
          resultMatrix = add(mathMatrixA, mathMatrixB);
          break;
        case 'subtract':
          resultMatrix = subtract(mathMatrixA, mathMatrixB);
          break;
        case 'multiply':
          resultMatrix = multiply(mathMatrixA, mathMatrixB);
          break;
        case 'determinantA':
          calculateDeterminant(matrixA, 'A');
          return;
        case 'determinantB':
          calculateDeterminant(matrixB, 'B');
          return;
        case 'inverseA':
          if (Math.abs(det(mathMatrixA)) < 1e-10) {
            setError('Matrix A is not invertible (determinant is zero)');
            setResult(null);
            return;
          }
          resultMatrix = inv(mathMatrixA);
          break;
        case 'inverseB':
          if (Math.abs(det(mathMatrixB)) < 1e-10) {
            setError('Matrix B is not invertible (determinant is zero)');
            setResult(null);
            return;
          }
          resultMatrix = inv(mathMatrixB);
          break;
        case 'transposeA':
          resultMatrix = transpose(mathMatrixA);
          break;
        case 'transposeB':
          resultMatrix = transpose(mathMatrixB);
          break;
        default:
          setError('Invalid operation');
          return;
      }
      
      // Convert result to array and round small values to 0
      const resultArray = (resultMatrix as Matrix).toArray() as MatrixType;
      const roundedResult = resultArray.map(row =>
        row.map(val => Math.abs(val) < 1e-10 ? 0 : val)
      );
      setResult(roundedResult);
      setError('');
    } catch (error) {
      handleError(error);
    }
  };

  const renderMatrix = (matrix: MatrixType, onChange: (row: number, col: number, value: string) => void) => {
    return (
      <div className="bg-purple-900/30 p-2 rounded-lg">
        <table className="w-full">
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="p-1">
                    <input
                      type="number"
                      value={cell}
                      onChange={(e) => onChange(rowIndex, colIndex, e.target.value)}
                      className="w-full bg-purple-900/50 text-white p-1 rounded text-center focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderResultMatrix = (matrix: MatrixType | string | null) => {
    if (!matrix) return null;
    
    if (typeof matrix === 'string') {
      return <div className="text-white text-center p-2">{matrix}</div>;
    }
    
    return (
      <div className="bg-purple-900/30 p-2 rounded-lg">
        <table className="w-full">
          <tbody>
            {matrix.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="p-1">
                    <div className="bg-purple-900/50 text-white p-1 rounded text-center">
                      {typeof cell === 'number' ? cell.toFixed(2) : cell}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-xl text-white font-bold text-center">Matrix Calculator</h2>
      
      <div className="flex justify-between items-center">
        <div>
          <label className="text-purple-200 text-sm">Rows</label>
          <input
            type="number"
            min="1"
            max="5"
            value={dimensions.rows}
            onChange={(e) => handleDimensionChange('rows', e.target.value)}
            className="w-16 bg-purple-900/30 text-white p-1 rounded ml-2 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-purple-200 text-sm">Columns</label>
          <input
            type="number"
            min="1"
            max="5"
            value={dimensions.cols}
            onChange={(e) => handleDimensionChange('cols', e.target.value)}
            className="w-16 bg-purple-900/30 text-white p-1 rounded ml-2 focus:outline-none"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-white text-sm font-medium mb-1">Matrix A</h3>
          {renderMatrix(matrixA, handleMatrixAChange)}
          {!isSquareMatrix(matrixA) && (
            <div className="text-yellow-300 text-xs mt-1">
              * Not a square matrix (determinant and inverse require square matrices)
            </div>
          )}
        </div>
        <div>
          <h3 className="text-white text-sm font-medium mb-1">Matrix B</h3>
          {renderMatrix(matrixB, handleMatrixBChange)}
          {!isSquareMatrix(matrixB) && (
            <div className="text-yellow-300 text-xs mt-1">
              * Not a square matrix (determinant and inverse require square matrices)
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => { setOperation('add'); calculateResult(); }}
          className="bg-purple-600/50 text-white p-2 rounded hover:bg-purple-600/70"
        >
          A + B
        </button>
        <button
          onClick={() => { setOperation('subtract'); calculateResult(); }}
          className="bg-purple-600/50 text-white p-2 rounded hover:bg-purple-600/70"
        >
          A - B
        </button>
        <button
          onClick={() => { setOperation('multiply'); calculateResult(); }}
          className="bg-purple-600/50 text-white p-2 rounded hover:bg-purple-600/70"
        >
          A × B
        </button>
        <button
          onClick={() => { setOperation('determinantA'); calculateResult(); }}
          className={`${isSquareMatrix(matrixA) ? 'bg-purple-600/50 hover:bg-purple-600/70' : 'bg-gray-600/50 cursor-not-allowed'} text-white p-2 rounded`}
          disabled={!isSquareMatrix(matrixA)}
        >
          det(A)
        </button>
        <button
          onClick={() => { setOperation('determinantB'); calculateResult(); }}
          className={`${isSquareMatrix(matrixB) ? 'bg-purple-600/50 hover:bg-purple-600/70' : 'bg-gray-600/50 cursor-not-allowed'} text-white p-2 rounded`}
          disabled={!isSquareMatrix(matrixB)}
        >
          det(B)
        </button>
        <button
          onClick={() => { setOperation('inverseA'); calculateResult(); }}
          className={`${isSquareMatrix(matrixA) ? 'bg-purple-600/50 hover:bg-purple-600/70' : 'bg-gray-600/50 cursor-not-allowed'} text-white p-2 rounded`}
          disabled={!isSquareMatrix(matrixA)}
        >
          A⁻¹
        </button>
        <button
          onClick={() => { setOperation('inverseB'); calculateResult(); }}
          className={`${isSquareMatrix(matrixB) ? 'bg-purple-600/50 hover:bg-purple-600/70' : 'bg-gray-600/50 cursor-not-allowed'} text-white p-2 rounded`}
          disabled={!isSquareMatrix(matrixB)}
        >
          B⁻¹
        </button>
        <button
          onClick={() => { setOperation('transposeA'); calculateResult(); }}
          className="bg-purple-600/50 text-white p-2 rounded hover:bg-purple-600/70"
        >
          Aᵀ
        </button>
        <button
          onClick={() => { setOperation('transposeB'); calculateResult(); }}
          className="bg-purple-600/50 text-white p-2 rounded hover:bg-purple-600/70"
        >
          Bᵀ
        </button>
      </div>
      
      {error && (
        <div className="text-red-400 text-center p-2 bg-red-900/20 rounded">{error}</div>
      )}
      
      {result && (
        <div>
          <h3 className="text-white text-sm font-medium mb-1">Result</h3>
          {renderResultMatrix(result)}
        </div>
      )}
      
      {explanation && (
        <div className="bg-purple-900/20 p-3 rounded text-purple-200 text-sm">
          <h3 className="text-white text-sm font-medium mb-1">Explanation</h3>
          <p className="whitespace-pre-line">{explanation}</p>
        </div>
      )}
      
      <div className="mt-4 bg-purple-900/20 p-3 rounded text-purple-200 text-sm">
        <h3 className="text-white text-sm font-medium mb-1">About Determinants</h3>
        <p>
          The determinant is a special number calculated from a square matrix. It has several important properties:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Only defined for square matrices (same number of rows and columns)</li>
          <li>If det(A) = 0, the matrix is singular (not invertible)</li>
          <li>If det(A) ≠ 0, the matrix is invertible</li>
          <li>|det(A)| represents the scaling factor of the linear transformation</li>
          <li>det(AB) = det(A) × det(B)</li>
          <li>det(A⁻¹) = 1/det(A)</li>
          <li>det(Aᵀ) = det(A)</li>
        </ul>
      </div>
    </div>
  );
};

export default MatrixCalculator;
  