import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SWATCHES } from '@/constants';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import './Canvas.css';
import { motion } from 'framer-motion';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

type Tool = 'pen' | 'eraser';

interface DrawingState {
    tool: Tool;
    lineWidth: number;
    color: string;
}

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingState, setDrawingState] = useState<DrawingState>({
        tool: 'pen',
        lineWidth: 3,
        color: 'rgb(255, 255, 255)'
    });
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [undoStack, setUndoStack] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);
    const [isToolsVisible, setIsToolsVisible] = useState(false);
    const navigate = useNavigate();

    const renderLatexToCanvas = useCallback((expression: string, answer: string) => {
        let latex;
        if (answer.length > 50) {
            // For long answers, break them into chunks of 50 characters
            const parts = answer.match(/.{1,50}/g) || [];
            // If answer is very long, add line breaks more frequently
            if (parts.length > 3) {
                latex = `\\(\\LARGE{${expression} = \\\\[0.5em]${parts.join('\\\\[0.5em]')}}\\)`;
            } else {
                latex = `\\(\\LARGE{${expression} = \\\\${parts.join('\\\\')}}\\)`;
            }
        } else {
            latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        }
        setLatexExpression(prev => [...prev, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result, renderLatexToCanvas]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth - 32;
                canvas.height = window.innerHeight - 200;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
                canvas.style.background = 'black';
            }
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    };

    const saveCanvasState = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setUndoStack(prev => [...prev, imageData]);
                setRedoStack([]);
            }
        }
    }, []);

    const undo = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas && undoStack.length > 0) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const previousState = undoStack[undoStack.length - 1];
                
                setRedoStack(prev => [...prev, currentState]);
                setUndoStack(prev => prev.slice(0, -1));
                
                ctx.putImageData(previousState, 0, 0);
            }
        }
    }, [undoStack]);

    const redo = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas && redoStack.length > 0) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const nextState = redoStack[redoStack.length - 1];
                
                setUndoStack(prev => [...prev, currentState]);
                setRedoStack(prev => prev.slice(0, -1));
                
                ctx.putImageData(nextState, 0, 0);
            }
        }
    }, [redoStack]);

    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            }

            switch(e.key.toLowerCase()) {
                case 't':
                    if (!e.ctrlKey && !e.metaKey) {
                        setIsToolsVisible(prev => !prev);
                    }
                    break;
                case 'p':
                    if (!e.ctrlKey && !e.metaKey) {
                        setDrawingState(prev => ({ ...prev, tool: 'pen' }));
                    }
                    break;
                case 'e':
                    if (!e.ctrlKey && !e.metaKey) {
                        setDrawingState(prev => ({ ...prev, tool: 'eraser' }));
                    }
                    break;
                case '[':
                    setDrawingState(prev => ({ 
                        ...prev, 
                        lineWidth: Math.max(1, prev.lineWidth - 1)
                    }));
                    break;
                case ']':
                    setDrawingState(prev => ({ 
                        ...prev, 
                        lineWidth: Math.min(20, prev.lineWidth + 1)
                    }));
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, [undo, redo]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const pos = getMousePos(canvas, e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineCap = 'round';
                ctx.lineWidth = drawingState.lineWidth;
                ctx.strokeStyle = drawingState.tool === 'eraser' ? 'black' : drawingState.color;
                setIsDrawing(true);
                saveCanvasState();
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const pos = getMousePos(canvas, e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };  

    const runRoute = async () => {
        const canvas = canvasRef.current;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        if (canvas) {
            try {
                setIsCalculating(true);
                const response = await axios({
                    method: 'post',
                    url: `${apiUrl}/calculate`,
                    data: {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars
                    }
                });

                const resp = await response.data;
                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        setDictOfVars({
                            ...dictOfVars,
                            [data.expr]: data.result
                        });
                    }
                });

                resp.data.forEach((data: Response) => {
                    setTimeout(() => {
                        setResult({
                            expression: data.expr,
                            answer: data.result
                        });
                    }, 500);
                });
            } catch (error) {
                console.error('Error running route:', error);
            } finally {
                setIsCalculating(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex gap-4">
            {/* Loading Animation - Moved to root level */}
            {isCalculating && (
                <div className="modern-loading">
                    <div className="modern-loading-circle" />
                    <div className="text-white text-lg font-medium">Processing...</div>
                </div>
            )}

            {/* Main Drawing Area */}
            <div className="flex-1 flex flex-col">
                <div className='grid grid-cols-4 gap-4 mb-6'>
                    <Button
                        onClick={() => navigate('/calculator')}
                        className='button-hover z-20 bg-gray-600 hover:bg-gray-700 text-white transition-all duration-300 flex items-center gap-2'
                        variant='default'
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                        Back
                    </Button>
                    <Button
                        onClick={() => setReset(true)}
                        className='button-hover z-20 bg-red-600 hover:bg-red-700 text-white transition-all duration-300'
                        variant='default'
                    >
                        Reset
                    </Button>
                    <Group className='z-20 p-2 bg-gray-800 rounded-lg'>
                        {SWATCHES.map((swatch) => (
                            <ColorSwatch 
                                key={swatch} 
                                color={swatch} 
                                onClick={() => setDrawingState(prev => ({ ...prev, color: swatch }))}
                                className={`cursor-pointer transform hover:scale-110 transition-transform duration-200 ${
                                    drawingState.color === swatch ? 'ring-2 ring-white' : ''
                                }`}
                                size={24}
                            />
                        ))}
                    </Group>
                    <Button
                        onClick={runRoute}
                        disabled={isCalculating}
                        className='button-hover z-20 bg-green-600 hover:bg-green-700 text-white transition-all duration-300'
                        variant='default'
                    >
                        {isCalculating ? (
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        ) : (
                            'Run'
                        )}
                    </Button>
                </div>
                
                <div className="canvas-container flex-1 relative rounded-lg overflow-hidden bg-black">
                    {/* Tools Toggle Button */}
                    <button 
                        className={`tools-toggle ${isToolsVisible ? 'hidden' : ''}`}
                        onClick={() => setIsToolsVisible(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>

                    {/* Drawing Tools Panel */}
                    <div className={`drawing-tools ${isToolsVisible ? 'visible' : ''}`}>
                        <button 
                            className="tool-button ml-auto"
                            onClick={() => setIsToolsVisible(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>

                        <button 
                            className={`tool-button ${drawingState.tool === 'pen' ? 'active' : ''}`}
                            onClick={() => setDrawingState(prev => ({ ...prev, tool: 'pen' }))}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                                <path d="M2 2l7.586 7.586"/>
                                <circle cx="11" cy="11" r="2"/>
                            </svg>
                            <span className="tool-tooltip">Pen (P)</span>
                        </button>
                        
                        <button 
                            className={`tool-button ${drawingState.tool === 'eraser' ? 'active' : ''}`}
                            onClick={() => setDrawingState(prev => ({ ...prev, tool: 'eraser' }))}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4L20 11L11 20"/>
                            </svg>
                            <span className="tool-tooltip">Eraser (E)</span>
                        </button>

                        <button 
                            className="tool-button"
                            onClick={undo}
                            disabled={undoStack.length === 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7v6h6"/>
                                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
                            </svg>
                            <span className="tool-tooltip">Undo (Ctrl+Z)</span>
                        </button>

                        <button 
                            className="tool-button"
                            onClick={redo}
                            disabled={redoStack.length === 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 7v6h-6"/>
                                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/>
                            </svg>
                            <span className="tool-tooltip">Redo (Ctrl+Shift+Z)</span>
                        </button>

                        <div className="px-2">
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={drawingState.lineWidth}
                                onChange={(e) => setDrawingState(prev => ({ 
                                    ...prev, 
                                    lineWidth: parseInt(e.target.value) 
                                }))}
                                className="thickness-slider"
                            />
                        </div>
                    </div>

                    {/* Shortcut Hint */}
                    <div className="shortcut-hint">
                        Press T to toggle tools panel
                    </div>

                    <canvas
                        ref={canvasRef}
                        id='canvas'
                        className='w-full h-full cursor-crosshair'
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                    />
                </div>
            </div>

            {/* Output Panel */}
            <div className="output-panel w-96 rounded-lg p-4 flex flex-col">
                <h2 className="text-white text-xl font-semibold mb-4">Calculations</h2>
                <div className="flex-1 overflow-y-auto space-y-4 output-scroll">
                    {latexExpression.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">
                            Draw an equation and click Run to see the results
                        </div>
                    ) : (
                        latexExpression.map((latex, index) => (
                            <motion.div 
                                key={index}
                                className="latex-output"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <div className="latex-content">{latex}</div>
                            </motion.div>
                        ))
                    )}
                </div>
                {latexExpression.length > 0 && (
                    <motion.button 
                        onClick={() => setReset(true)}
                        className="mt-4 w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Clear All Results
                    </motion.button>
                )}
            </div>

            {/* GeekyNerds Signature */}
            <a 
                href="https://geekynerds.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="brand-signature"
            >
                <div className="brand-logo">GN</div>
                <div className="brand-text">
                    Made with 🧠 by <span>GeekyNerds</span>
                </div>
            </a>
        </div>
    );
} 