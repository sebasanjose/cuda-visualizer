import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';

const CudaVisualizer = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(100);
  const [code, setCode] = useState('');
  const [highlightedLine, setHighlightedLine] = useState(10);
  const [phase, setPhase] = useState(0);
  const codeContainerRef = useRef(null);
  
  useEffect(() => {
    // Load the code
    const fetchCode = async () => {
      try {
        const response = await fetch('/matMulTiling.cu');
        const fileData = await response.text();
        setCode(fileData);
      } catch (error) {
        console.error("Error reading file:", error);
        setCode('#include <stdio.h>\n#include <cuda_runtime.h>\n// Error loading code file');
      }
    };
    
    fetchCode();
  }, []);
  
  useEffect(() => {
    // Simulate different code lines being highlighted based on the current step
    setHighlightedLine(Math.max(10, Math.min(40, 10 + Math.floor(currentStep / 3))));
    
    // Determine which phase we're in based on the current step
    setPhase(currentStep < 50 ? 0 : 1);
    
    // Scroll to the highlighted line
    if (codeContainerRef.current) {
      const lineHeight = 20; // approximate line height in pixels
      const scrollPosition = (highlightedLine - 5) * lineHeight;
      codeContainerRef.current.scrollTop = scrollPosition;
    }
  }, [currentStep, highlightedLine]);
  
  const handleSliderChange = (e) => {
    setCurrentStep(parseInt(e.target.value, 10));
  };
  
  const formatCode = () => {
    if (!code) return [];
    
    return code.split('\n').map((line, index) => {
      const lineNumber = index + 1;
      return (
        <div 
          key={lineNumber} 
          className={`code-line ${lineNumber === highlightedLine ? 'bg-yellow-100' : ''}`}
          style={{position: 'relative', paddingLeft: '3rem'}}
        >
          <span 
            className="absolute left-0 w-8 text-right pr-2 text-gray-500 select-none"
            style={{userSelect: 'none'}}
          >
            {lineNumber}
          </span>
          <pre className="font-mono">{line}</pre>
          {lineNumber === highlightedLine && (
            <div 
              className="absolute left-0 right-0 h-full bg-yellow-200 opacity-20" 
              style={{pointerEvents: 'none'}}
            ></div>
          )}
        </div>
      );
    });
  };
  
  // Matrix visualization components
  const MatrixM = ({ highlightCol }) => {
    const size = 4;
    return (
      <div className="relative">
        <div className="text-center font-bold mb-2">Matrix M</div>
        <div className="grid grid-cols-4 gap-px bg-gray-400 p-px">
          {_.range(size).map(row => (
            _.range(size).map(col => (
              <div 
                key={`m-${row}-${col}`} 
                className={`w-10 h-10 flex items-center justify-center bg-white
                  ${phase === 0 && col === highlightCol ? 'bg-blue-200' : ''}
                  ${row === Math.floor(currentStep/25) && col === Math.floor((currentStep%25)/6) ? 'ring-2 ring-red-500' : ''}
                `}
              >
                M<sub>{row},{col}</sub>
              </div>
            ))
          ))}
        </div>
      </div>
    );
  };
  
  const MatrixN = ({ highlightRow }) => {
    const size = 4;
    return (
      <div className="relative">
        <div className="text-center font-bold mb-2">Matrix N</div>
        <div className="grid grid-cols-4 gap-px bg-gray-400 p-px">
          {_.range(size).map(row => (
            _.range(size).map(col => (
              <div 
                key={`n-${row}-${col}`} 
                className={`w-10 h-10 flex items-center justify-center bg-white
                  ${phase === 0 && row === highlightRow ? 'bg-blue-200' : ''}
                  ${row === Math.floor((currentStep%25)/6) && col === Math.floor(currentStep/25) ? 'ring-2 ring-red-500' : ''}
                `}
              >
                N<sub>{row},{col}</sub>
              </div>
            ))
          ))}
        </div>
      </div>
    );
  };
  
  const MatrixP = () => {
    const size = 4;
    return (
      <div className="relative">
        <div className="text-center font-bold mb-2">Result Matrix P</div>
        <div className="grid grid-cols-4 gap-px bg-gray-400 p-px">
          {_.range(size).map(row => (
            _.range(size).map(col => {
              // Determine if this cell is currently being calculated
              const isActive = row === Math.floor(currentStep/25) && col === Math.floor(currentStep/25);
              // Calculate a fill percentage based on the current step
              const progress = isActive ? 
                Math.min(100, (currentStep % 25) * 4) : 
                (row < Math.floor(currentStep/25) || (row === Math.floor(currentStep/25) && col < Math.floor(currentStep/25))) ? 
                100 : 0;
              
              return (
                <div key={`p-${row}-${col}`} className="relative w-10 h-10 bg-white">
                  <div 
                    className="absolute inset-0 bg-green-200 flex items-center justify-center"
                    style={{ width: `${progress}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    P<sub>{row},{col}</sub>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  // Shared memory visualization
  const SharedMemory = () => {
    const size = 2;
    const m_start_row = Math.floor(currentStep/25) * 2;
    const n_start_col = Math.floor(currentStep/25) * 2;
    const tile_progress = Math.floor((currentStep % 25) / 6);
    
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="text-center font-bold">Shared Memory</div>
        <div className="flex justify-center gap-8 mt-4">
          <div>
            <div className="text-center mb-2">Tile M</div>
            <div className="grid grid-cols-2 gap-px bg-gray-400 p-px">
              {_.range(size).map(row => (
                _.range(size).map(col => (
                  <div 
                    key={`sm-${row}-${col}`} 
                    className={`w-10 h-10 flex items-center justify-center ${col <= tile_progress ? 'bg-blue-100' : 'bg-white'}`}
                  >
                    M<sub>{m_start_row+row},{Math.floor((currentStep%25)/6)+col}</sub>
                  </div>
                ))
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-center mb-2">Tile N</div>
            <div className="grid grid-cols-2 gap-px bg-gray-400 p-px">
              {_.range(size).map(row => (
                _.range(size).map(col => (
                  <div 
                    key={`sn-${row}-${col}`} 
                    className={`w-10 h-10 flex items-center justify-center ${row <= tile_progress ? 'bg-blue-100' : 'bg-white'}`}
                  >
                    N<sub>{Math.floor((currentStep%25)/6)+row},{n_start_col+col}</sub>
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="text-center mb-2">Execution Phase {phase}</div>
          <div className="bg-white p-2 rounded border">
            <p className="text-sm">
              {phase === 0 ? (
                `Loading tiles from global memory to shared memory: 
                Thread(${Math.floor(currentStep/10)},${currentStep%10}) loads elements`
              ) : (
                `Performing computation: Thread(${Math.floor(currentStep/10)},${currentStep%10})
                computing P[${Math.floor(currentStep/25)},${Math.floor(currentStep/25)}] += 
                M[${Math.floor(currentStep/25)},${Math.floor((currentStep%25)/6)}] * 
                N[${Math.floor((currentStep%25)/6)},${Math.floor(currentStep/25)}]`
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex-1 flex">
        {/* Graphics Section */}
        <div className="w-1/2 p-4 overflow-auto border-r border-gray-300 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Matrix Multiplication Visualization</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <MatrixM highlightCol={Math.floor((currentStep%25)/6)} />
            <MatrixN highlightRow={Math.floor((currentStep%25)/6)} />
          </div>
          
          <div className="mt-6">
            <MatrixP />
          </div>
          
          <div className="mt-6">
            <SharedMemory />
          </div>
        </div>
        
        {/* Code Section */}
        <div className="w-1/2 p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4">CUDA Code</h2>
          <div 
            ref={codeContainerRef}
            className="flex-1 overflow-auto font-mono text-sm border border-gray-300 rounded p-2 bg-gray-50"
          >
            {formatCode()}
          </div>
        </div>
      </div>
      
      {/* Timeline/Control Bar */}
      <div className="p-4 border-t border-gray-300">
        <div className="flex items-center">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded mr-4"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          >
            Prev
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={totalSteps}
              value={currentStep}
              onChange={handleSliderChange}
              className="w-full"
            />
          </div>
          
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded ml-4"
            onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
          >
            Next
          </button>
          
          <div className="ml-4 text-sm">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CudaVisualizer;