import React, { useState } from 'react';
import { evaluate, derivative, parse } from 'mathjs';

interface NewtonStep {
  iteration: number;
  x: number;
  f_x: number;
  f_prime_x: number;
  next_x: number;
}

interface BisectionStep {
  iteration: number;
  a: number;
  b: number;
  c: number;
  f_a: number;
  f_b: number;
  f_c: number;
}

interface QuadraticStep {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  root1: number;
  root2: number;
}

interface CubicStep {
  a: number;
  b: number;
  c: number;
  d: number;
  root: number;
}

type Step = NewtonStep | BisectionStep | QuadraticStep | CubicStep;
type Method = 'newton' | 'bisection' | 'quadratic' | 'cubic';

const EquationSolver: React.FC = () => {
  const [equation, setEquation] = useState<string>('x^2 - 4 = 0');
  const [variable, setVariable] = useState<string>('x');
  const [method, setMethod] = useState<Method>('newton');
  const [initialGuess, setInitialGuess] = useState<number>(1);
  const [tolerance, setTolerance] = useState<number>(0.0001);
  const [maxIterations, setMaxIterations] = useState<number>(100);
  const [solution, setSolution] = useState<string | number | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string>('');

  const parseEquation = (eq: string): string => {
    if (eq.includes('=')) {
      const [left, right] = eq.split('=').map(part => part.trim());
      return `(${left}) - (${right})`;
    }
    return eq;
  };

  const solveNewtonRaphson = (): void => {
    try {
      setError('');
      const parsedEquation = parseEquation(equation);
      const expr = parse(parsedEquation);
      const deriv = derivative(expr, variable);
      
      let x = parseFloat(initialGuess.toString());
      const tol = parseFloat(tolerance.toString());
      const maxIter = parseInt(maxIterations.toString());
      
      const newSteps: NewtonStep[] = [];
      let iter = 0;
      let prevX = x;
      
      while (iter < maxIter) {
        const f_x = evaluate(expr.toString(), { [variable]: x });
        const f_prime_x = evaluate(deriv.toString(), { [variable]: x });
        
        if (Math.abs(f_prime_x) < 1e-10) {
          setError('Derivative is too close to zero. Try a different initial guess.');
          return;
        }
        
        const nextX = x - f_x / f_prime_x;
        
        newSteps.push({
          iteration: iter + 1,
          x: x,
          f_x: f_x,
          f_prime_x: f_prime_x,
          next_x: nextX
        });
        
        if (Math.abs(nextX - x) < tol) {
          setSolution(nextX);
          setSteps(newSteps);
          return;
        }
        
        x = nextX;
        iter++;
        
        if (iter > 3 && Math.abs(x - prevX) > Math.abs(prevX)) {
          setError('The method is not converging. Try a different initial guess.');
          return;
        }
        
        prevX = x;
      }
      
      setError('Maximum iterations reached without convergence.');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const solveBisection = (): void => {
    try {
      setError('');
      const parsedEquation = parseEquation(equation);
      const expr = parse(parsedEquation);
      const exprStr = expr.toString();
      
      let a = parseFloat(initialGuess.toString());
      let b = a + 1;
      
      const f_a = evaluate(exprStr, { [variable]: a });
      let f_b = evaluate(exprStr, { [variable]: b });
      
      let attempts = 0;
      while (Math.sign(f_a) === Math.sign(f_b) && attempts < 20) {
        b = a < 0 ? a - Math.pow(2, attempts) : a + Math.pow(2, attempts);
        f_b = evaluate(exprStr, { [variable]: b });
        attempts++;
      }
      
      if (Math.sign(f_a) === Math.sign(f_b)) {
        setError('Could not find an interval with a sign change. Try a different initial guess.');
        return;
      }
      
      const tol = parseFloat(tolerance.toString());
      const maxIter = parseInt(maxIterations.toString());
      
      const newSteps: BisectionStep[] = [];
      let iter = 0;
      
      while (iter < maxIter) {
        const c = (a + b) / 2;
        const f_c = evaluate(exprStr, { [variable]: c });
        
        newSteps.push({
          iteration: iter + 1,
          a: a,
          b: b,
          c: c,
          f_a: evaluate(exprStr, { [variable]: a }),
          f_b: evaluate(exprStr, { [variable]: b }),
          f_c: f_c
        });
        
        if (Math.abs(f_c) < tol || Math.abs(b - a) < tol) {
          setSolution(c);
          setSteps(newSteps);
          return;
        }
        
        if (Math.sign(f_c) === Math.sign(evaluate(exprStr, { [variable]: a }))) {
          a = c;
        } else {
          b = c;
        }
        
        iter++;
      }
      
      setError('Maximum iterations reached without convergence.');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const solveQuadratic = (): void => {
    try {
      setError('');
      const parsedEquation = parseEquation(equation);
      const expr = parse(parsedEquation);
      const exprStr = expr.toString();
      
      // Try to find coefficients by evaluating at different points
      const x0 = evaluate(exprStr, { [variable]: 0 });
      const x1 = evaluate(exprStr, { [variable]: 1 });
      const x2 = evaluate(exprStr, { [variable]: 2 });
      
      // Use three points to find quadratic coefficients (a, b, c)
      const a = (x2 - 2 * x1 + x0) / 2;
      const b = x1 - x0 - a;
      const c = x0;
      
      // Check if it's really quadratic
      if (Math.abs(a) < 1e-10) {
        setError('This is not a quadratic equation. The coefficient of x² is too close to zero.');
        return;
      }
      
      const discriminant = b * b - 4 * a * c;
      
      if (discriminant < 0) {
        setError('This equation has complex roots.');
        return;
      }
      
      const sqrtDisc = Math.sqrt(discriminant);
      const root1 = (-b + sqrtDisc) / (2 * a);
      const root2 = (-b - sqrtDisc) / (2 * a);
      
      const newSteps: QuadraticStep[] = [
        {
          a: a,
          b: b,
          c: c,
          discriminant: discriminant,
          root1: root1,
          root2: root2
        }
      ];
      
      setSolution(root1);
      setSteps(newSteps);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const solveCubic = (): void => {
    try {
      setError('');
      const parsedEquation = parseEquation(equation);
      const expr = parse(parsedEquation);
      const exprStr = expr.toString();
      
      // Try to find coefficients by evaluating at different points
      const x0 = evaluate(exprStr, { [variable]: 0 });
      const x1 = evaluate(exprStr, { [variable]: 1 });
      const x2 = evaluate(exprStr, { [variable]: 2 });
      const x3 = evaluate(exprStr, { [variable]: 3 });
      
      // Use four points to find cubic coefficients (a, b, c, d)
      const a = (x3 - 3 * x2 + 3 * x1 - x0) / 6;
      const b = (x2 - 2 * x1 + x0) / 2 - a;
      const c = x1 - x0 - a - b;
      const d = x0;
      
      // Check if it's really cubic
      if (Math.abs(a) < 1e-10) {
        setError('This is not a cubic equation. The coefficient of x³ is too close to zero.');
        return;
      }
      
      // Use Newton's method to find one real root
      let x = parseFloat(initialGuess.toString());
      const tol = parseFloat(tolerance.toString());
      const maxIter = parseInt(maxIterations.toString());
      
      let iter = 0;
      while (iter < maxIter) {
        const f = a * x * x * x + b * x * x + c * x + d;
        const f_prime = 3 * a * x * x + 2 * b * x + c;
        
        if (Math.abs(f_prime) < 1e-10) {
          setError('Derivative is too close to zero. Try a different initial guess.');
          return;
        }
        
        const nextX = x - f / f_prime;
        
        if (Math.abs(nextX - x) < tol) {
          setSolution(nextX);
          setSteps([{
            a: a,
            b: b,
            c: c,
            d: d,
            root: nextX
          }]);
          return;
        }
        
        x = nextX;
        iter++;
      }
      
      setError('Maximum iterations reached without convergence.');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleSolve = (): void => {
    switch (method) {
      case 'newton':
        solveNewtonRaphson();
        break;
      case 'bisection':
        solveBisection();
        break;
      case 'quadratic':
        solveQuadratic();
        break;
      case 'cubic':
        solveCubic();
        break;
    }
  };

  const renderSteps = (): JSX.Element => {
    if (!steps.length) return <></>;

    if ('iteration' in steps[0]) {
      // Newton or Bisection steps
      const iterativeSteps = steps as (NewtonStep | BisectionStep)[];
      return (
        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-semibold">Solution Steps:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2">Iteration</th>
                  {('f_a' in iterativeSteps[0]) ? (
                    <>
                      <th className="px-4 py-2">a</th>
                      <th className="px-4 py-2">b</th>
                      <th className="px-4 py-2">c</th>
                      <th className="px-4 py-2">f(a)</th>
                      <th className="px-4 py-2">f(b)</th>
                      <th className="px-4 py-2">f(c)</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2">x</th>
                      <th className="px-4 py-2">f(x)</th>
                      <th className="px-4 py-2">f'(x)</th>
                      <th className="px-4 py-2">Next x</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {iterativeSteps.map((step, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2">{step.iteration}</td>
                    {'f_a' in step ? (
                      <>
                        <td className="px-4 py-2">{step.a.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.b.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.c.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.f_a.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.f_b.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.f_c.toFixed(6)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">{step.x.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.f_x.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.f_prime_x.toFixed(6)}</td>
                        <td className="px-4 py-2">{step.next_x.toFixed(6)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Quadratic or Cubic steps
    const directStep = steps[0] as (QuadraticStep | CubicStep);
    return (
      <div className="mt-4 space-y-2">
        <h3 className="text-lg font-semibold">Solution:</h3>
        <div className="space-y-1">
          {'root1' in directStep ? (
            <>
              <p>Quadratic equation coefficients:</p>
              <p>a = {directStep.a.toFixed(6)}</p>
              <p>b = {directStep.b.toFixed(6)}</p>
              <p>c = {directStep.c.toFixed(6)}</p>
              <p>Discriminant = {directStep.discriminant.toFixed(6)}</p>
              <p>Root 1 = {directStep.root1.toFixed(6)}</p>
              <p>Root 2 = {directStep.root2.toFixed(6)}</p>
            </>
          ) : (
            <>
              <p>Cubic equation coefficients:</p>
              <p>a = {directStep.a.toFixed(6)}</p>
              <p>b = {directStep.b.toFixed(6)}</p>
              <p>c = {directStep.c.toFixed(6)}</p>
              <p>d = {directStep.d.toFixed(6)}</p>
              <p>Found root = {directStep.root.toFixed(6)}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-xl text-white font-bold text-center">Equation Solver</h2>
      
      <div className="space-y-2">
        <div>
          <label className="text-purple-200 text-sm">Equation</label>
          <input
            type="text"
            value={equation}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEquation(e.target.value)}
            placeholder="e.g. x^2 - 4 = 0"
            className="w-full bg-purple-900/30 text-white p-2 rounded focus:outline-none mt-1"
          />
        </div>
        
        <div>
          <label className="text-purple-200 text-sm">Variable</label>
          <input
            type="text"
            value={variable}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariable(e.target.value)}
            className="w-full bg-purple-900/30 text-white p-2 rounded focus:outline-none mt-1"
          />
        </div>
        
        <div>
          <label className="text-purple-200 text-sm">Method</label>
          <select
            value={method}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value as Method)}
            className="w-full bg-purple-900/30 text-white p-2 rounded focus:outline-none mt-1"
          >
            <option value="newton">Newton-Raphson</option>
            <option value="bisection">Bisection</option>
            <option value="quadratic">Quadratic Formula</option>
            <option value="cubic">Cubic Formula</option>
          </select>
        </div>
        
        {(method === 'newton' || method === 'bisection') && (
          <>
            <div>
              <label className="text-purple-200 text-sm">Initial Guess</label>
              <input
                type="number"
                value={initialGuess}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialGuess(parseFloat(e.target.value))}
                className="w-full bg-purple-900/30 text-white p-2 rounded focus:outline-none mt-1"
              />
            </div>
            
            <div>
              <label className="text-purple-200 text-sm">Tolerance</label>
              <input
                type="number"
                value={tolerance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTolerance(parseFloat(e.target.value))}
                className="w-full bg-purple-900/30 text-white p-2 rounded focus:outline-none mt-1"
              />
            </div>
            
            <div>
              <label className="text-purple-200 text-sm">Max Iterations</label>
              <input
                type="number"
                value={maxIterations}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxIterations(parseInt(e.target.value))}
                className="w-full bg-purple-900/30 text-white p-2 rounded focus:outline-none mt-1"
              />
            </div>
          </>
        )}
        
        <button
          onClick={handleSolve}
          className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition-colors"
        >
          Solve
        </button>
      </div>
      
      {error && (
        <div className="text-red-400 text-center">{error}</div>
      )}
      
      {solution && (
        <div className="bg-purple-900/30 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Solution</h3>
          <div className="text-purple-200">{solution}</div>
          
          <h3 className="text-white font-semibold mt-4 mb-2">Steps</h3>
          <div className="text-purple-200">
            {renderSteps()}
          </div>
        </div>
      )}
    </div>
  );
};

export default EquationSolver; 