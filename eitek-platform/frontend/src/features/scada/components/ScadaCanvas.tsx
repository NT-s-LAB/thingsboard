'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { useScadaStore } from '../stores/scadaStore';
import type { Widget } from '../types';

interface ScadaCanvasProps {
  width: number;
  height: number;
}

export const ScadaCanvas: React.FC<ScadaCanvasProps> = ({
  width,
  height,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  const {
    currentDashboard,
    editorState,
    isRuntimeMode,
    selectWidget,
    selectWidgets,
    clearSelection,
    moveWidget,
    resizeWidget,
    setViewport,
  } = useScadaStore();

  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);

  // Handle viewport changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateViewport = () => {
      const position = stage.position();
      const scale = stage.scaleX();
      
      setViewport({
        position: { x: -position.x / scale, y: -position.y / scale },
        zoom: scale,
        size: { width: width / scale, height: height / scale },
      });
    };

    stage.on('dragend', updateViewport);
    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      
      const scaleBy = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition()!;
      
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };
      
      stage.position(newPos);
      updateViewport();
    });

    return () => {
      stage.off('dragend');
      stage.off('wheel');
    };
  }, [width, height, setViewport]);

  // Handle transformer selection
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedShapes.length > 0) {
      const stage = stageRef.current;
      if (!stage) return;

      const nodes = selectedShapes
        .map(id => stage.findOne(`#${id}`))
        .filter((node): node is Konva.Node => node !== undefined);
      
      transformer.nodes(nodes);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
    }
  }, [selectedShapes]);

  // Update selected shapes when store selection changes
  useEffect(() => {
    setSelectedShapes(editorState.selection.selectedWidgetIds);
  }, [editorState.selection.selectedWidgetIds]);

  const handleStageClick = (e: any) => {
    if (isRuntimeMode) return;

    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      clearSelection();
    }
  };

  const handleShapeClick = (widgetId: string, e: any) => {
    if (isRuntimeMode) {
      // Handle runtime interactions
      return;
    }

    e.cancelBubble = true;

    const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
    
    if (isMultiSelect) {
      const currentSelection = [...editorState.selection.selectedWidgetIds];
      const index = currentSelection.indexOf(widgetId);
      
      if (index === -1) {
        currentSelection.push(widgetId);
      } else {
        currentSelection.splice(index, 1);
      }
      
      selectWidgets(currentSelection);
    } else {
      selectWidget(widgetId);
    }
  };

  const handleShapeDragEnd = (widgetId: string, e: any) => {
    if (isRuntimeMode) return;

    const node = e.target;
    const newPosition = {
      x: node.x(),
      y: node.y(),
    };

    moveWidget(widgetId, newPosition);
  };

  const handleTransformEnd = (e: any) => {
    if (isRuntimeMode) return;

    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and update size
    node.scaleX(1);
    node.scaleY(1);
    
    const newSize = {
      width: Math.max(10, node.width() * scaleX),
      height: Math.max(10, node.height() * scaleY),
    };

    const widgetId = node.id();
    if (widgetId) {
      resizeWidget(widgetId, newSize);
    }
  };

  const renderWidget = (widget: Widget) => {
    const commonProps = {
      id: widget.id,
      x: widget.transform.position.x,
      y: widget.transform.position.y,
      width: widget.transform.size.width,
      height: widget.transform.size.height,
      rotation: widget.transform.rotation || 0,
      draggable: !isRuntimeMode && !widget.locked,
      onClick: (e: any) => handleShapeClick(widget.id, e),
      onDragEnd: (e: any) => handleShapeDragEnd(widget.id, e),
      onTransformEnd: handleTransformEnd,
      opacity: widget.style.opacity || 1,
    };

    switch (widget.type) {
      case 'button':
        return (
          <Group key={widget.id} {...commonProps}>
            <Rect
              width={widget.transform.size.width}
              height={widget.transform.size.height}
              fill={widget.style.backgroundColor || '#3B82F6'}
              stroke={widget.style.borderColor || '#2563EB'}
              strokeWidth={widget.style.borderWidth || 1}
              cornerRadius={widget.style.borderRadius || 4}
            />
            <Text
              text={(widget as any).properties?.text || 'Button'}
              fontSize={widget.style.fontSize || 14}
              fontFamily={widget.style.fontFamily || 'Arial'}
              fill={widget.style.textColor || '#FFFFFF'}
              align="center"
              verticalAlign="middle"
              width={widget.transform.size.width}
              height={widget.transform.size.height}
            />
          </Group>
        );

      case 'text':
        return (
          <Text
            key={widget.id}
            {...commonProps}
            text={(widget as any).properties?.text || 'Text Widget'}
            fontSize={widget.style.fontSize || 14}
            fontFamily={widget.style.fontFamily || 'Arial'}
            fill={widget.style.textColor || '#000000'}
            align={widget.style.textAlign || 'left'}
          />
        );

      case 'shape':
        const shapeProps = (widget as any).properties;
        if (shapeProps?.shape === 'rectangle') {
          return (
            <Rect
              key={widget.id}
              {...commonProps}
              fill={shapeProps.fill ? shapeProps.fillColor || '#E5E7EB' : 'transparent'}
              stroke={shapeProps.strokeColor || '#374151'}
              strokeWidth={shapeProps.strokeWidth || 1}
              cornerRadius={widget.style.borderRadius || 0}
            />
          );
        } else if (shapeProps?.shape === 'circle') {
          const radius = Math.min(widget.transform.size.width, widget.transform.size.height) / 2;
          return (
            <Circle
              key={widget.id}
              {...commonProps}
              x={widget.transform.position.x + radius}
              y={widget.transform.position.y + radius}
              radius={radius}
              fill={shapeProps.fill ? shapeProps.fillColor || '#E5E7EB' : 'transparent'}
              stroke={shapeProps.strokeColor || '#374151'}
              strokeWidth={shapeProps.strokeWidth || 1}
            />
          );
        } else if (shapeProps?.shape === 'line') {
          return (
            <Line
              key={widget.id}
              {...commonProps}
              points={[
                0, 0,
                widget.transform.size.width, widget.transform.size.height
              ]}
              stroke={shapeProps.strokeColor || '#374151'}
              strokeWidth={shapeProps.strokeWidth || 2}
            />
          );
        }
        break;

      case 'gauge':
        return (
          <Group key={widget.id} {...commonProps}>
            <Circle
              x={widget.transform.size.width / 2}
              y={widget.transform.size.height / 2}
              radius={Math.min(widget.transform.size.width, widget.transform.size.height) / 2 - 10}
              stroke={widget.style.borderColor || '#E5E7EB'}
              strokeWidth={widget.style.borderWidth || 2}
              fill="transparent"
            />
            <Text
              text={`${(widget as any).properties?.value || 0}${(widget as any).properties?.unit || ''}`}
              fontSize={widget.style.fontSize || 16}
              fontFamily={widget.style.fontFamily || 'Arial'}
              fill={widget.style.textColor || '#000000'}
              align="center"
              verticalAlign="middle"
              x={0}
              y={widget.transform.size.height / 2 - 10}
              width={widget.transform.size.width}
            />
          </Group>
        );

      case 'image':
        // TODO: Implement image widget with Konva.Image
        return (
          <Rect
            key={widget.id}
            {...commonProps}
            fill="#F3F4F6"
            stroke="#D1D5DB"
            strokeWidth={1}
            cornerRadius={4}
          />
        );

      case 'container':
        return (
          <Group key={widget.id} {...commonProps}>
            <Rect
              width={widget.transform.size.width}
              height={widget.transform.size.height}
              fill={widget.style.backgroundColor || 'transparent'}
              stroke={widget.style.borderColor || '#E5E7EB'}
              strokeWidth={widget.style.borderWidth || 1}
              cornerRadius={widget.style.borderRadius || 0}
            />
          </Group>
        );

      default:
        // Fallback for unsupported widget types
        return (
          <Group key={widget.id} {...commonProps}>
            <Rect
              width={widget.transform.size.width}
              height={widget.transform.size.height}
              fill="#F9FAFB"
              stroke="#D1D5DB"
              strokeWidth={1}
              strokeDashArray={[5, 5]}
              cornerRadius={4}
            />
            <Text
              text={widget.type.toUpperCase()}
              fontSize={12}
              fontFamily="Arial"
              fill="#6B7280"
              align="center"
              verticalAlign="middle"
              width={widget.transform.size.width}
              height={widget.transform.size.height}
            />
          </Group>
        );
    }

    return null;
  };

  const renderGrid = () => {
    if (!editorState.showGrid || isRuntimeMode) return null;

    const gridSize = currentDashboard?.settings.grid.size || 20;
    const gridColor = currentDashboard?.settings.grid.color || '#E5E7EB';
    const canvasSize = currentDashboard?.canvasSize || { width: 1920, height: 1080 };

    const lines = [];
    
    // Vertical lines
    for (let i = 0; i <= canvasSize.width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, canvasSize.height]}
          stroke={gridColor}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= canvasSize.height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, canvasSize.width, i]}
          stroke={gridColor}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }

    return lines;
  };

  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <div className="text-gray-500">No dashboard loaded</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={!isRuntimeMode}
        onClick={handleStageClick}
        scale={{
          x: editorState.viewport.zoom,
          y: editorState.viewport.zoom,
        }}
        x={-editorState.viewport.position.x * editorState.viewport.zoom}
        y={-editorState.viewport.position.y * editorState.viewport.zoom}
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={currentDashboard.canvasSize.width}
            height={currentDashboard.canvasSize.height}
            fill={currentDashboard.backgroundColor || '#FFFFFF'}
          />
          
          {/* Grid */}
          {renderGrid()}
        </Layer>
        
        {/* Widget layers */}
        {currentDashboard.layers.map(layer => (
          <Layer
            key={layer.id}
            visible={layer.visible}
            opacity={layer.opacity}
          >
            {currentDashboard.widgets
              .filter(widget => widget.layerId === layer.id || (!widget.layerId && layer.order === 0))
              .filter(widget => widget.visible)
              .sort((a, b) => (a.transform.zIndex || 0) - (b.transform.zIndex || 0))
              .map(renderWidget)}
          </Layer>
        ))}

        {/* Default layer for widgets without layer assignment */}
        <Layer>
          {currentDashboard.widgets
            .filter(widget => !widget.layerId)
            .filter(widget => widget.visible)
            .sort((a, b) => (a.transform.zIndex || 0) - (b.transform.zIndex || 0))
            .map(renderWidget)}
        </Layer>

        {/* Selection transformer */}
        {!isRuntimeMode && (
          <Layer>
            <Transformer
              ref={transformerRef}
              rotateEnabled={true}
              borderStroke="#2563EB"
              borderStrokeWidth={2}
              anchorStroke="#2563EB"
              anchorFill="#FFFFFF"
              anchorStrokeWidth={2}
              anchorSize={8}
              keepRatio={false}
              enabledAnchors={[
                'top-left', 'top-center', 'top-right',
                'middle-left', 'middle-right',
                'bottom-left', 'bottom-center', 'bottom-right'
              ]}
            />
          </Layer>
        )}
      </Stage>

      {/* Canvas overlay for runtime mode */}
      {isRuntimeMode && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
          Runtime Mode
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 bg-white border border-gray-300 px-2 py-1 rounded text-sm">
        {Math.round(editorState.viewport.zoom * 100)}%
      </div>
    </div>
  );
};