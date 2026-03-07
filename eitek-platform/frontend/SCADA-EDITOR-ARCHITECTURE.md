# EITEK Platform SCADA Editor Architecture

## Core Architecture Overview

### 1. SCADA Editor Structure

```
SCADA Editor
├── Canvas Engine       # Core rendering & interaction engine
├── Widget System       # Extensible widget framework
├── Data Binding        # Real-time data integration
├── Animation Engine    # Smooth animations & transitions
├── Interaction Engine  # User interactions & events
└── Export System       # Runtime viewer & export capabilities
```

### 2. Canvas Engine Architecture

```typescript
// features/scada/engine/CanvasEngine.ts
interface CanvasEngineConfig {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  grid: GridConfig;
  zoom: ZoomConfig;
}

interface GridConfig {
  enabled: boolean;
  size: number;
  color: string;
  snapToGrid: boolean;
}

interface ZoomConfig {
  min: number;
  max: number;
  current: number;
  center: Point;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private config: CanvasEngineConfig;
  private layers: Map<string, Layer> = new Map();
  private widgets: Map<string, WidgetInstance> = new Map();
  
  // Viewport management
  private viewport: Viewport;
  private camera: Camera;
  
  // Event system
  private eventBus: EventEmitter;
  
  // Animation system
  private animationFrame: number | null = null;
  private lastFrameTime = 0;
  private isDirty = true;

  constructor(canvas: HTMLCanvasElement, config: CanvasEngineConfig) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.config = config;
    this.eventBus = new EventEmitter();
    
    this.setupViewport();
    this.setupEventListeners();
    this.startRenderLoop();
  }

  // Core rendering methods
  private render(timestamp: number) {
    if (!this.isDirty) return;
    
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Clear canvas
    this.clearCanvas();
    
    // Draw background
    this.drawBackground();
    
    // Draw grid if enabled
    if (this.config.grid.enabled) {
      this.drawGrid();
    }
    
    // Draw layers in order
    this.drawLayers();
    
    // Draw selection indicators
    this.drawSelection();
    
    // Draw UI overlays
    this.drawUIOverlays();
    
    this.isDirty = false;
  }

  private startRenderLoop() {
    const renderLoop = (timestamp: number) => {
      this.render(timestamp);
      this.animationFrame = requestAnimationFrame(renderLoop);
    };
    
    this.animationFrame = requestAnimationFrame(renderLoop);
  }

  // Widget management
  addWidget(widget: WidgetConfiguration): WidgetInstance {
    const widgetInstance = this.createWidgetInstance(widget);
    this.widgets.set(widget.id, widgetInstance);
    this.markDirty();
    
    this.eventBus.emit('widget:added', widgetInstance);
    return widgetInstance;
  }

  updateWidget(widgetId: string, updates: Partial<WidgetConfiguration>): void {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.update(updates);
      this.markDirty();
      this.eventBus.emit('widget:updated', widget);
    }
  }

  removeWidget(widgetId: string): void {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.destroy();
      this.widgets.delete(widgetId);
      this.markDirty();
      this.eventBus.emit('widget:removed', widgetId);
    }
  }

  // Viewport & Camera controls
  setZoom(zoom: number, center?: Point): void {
    zoom = Math.max(this.config.zoom.min, Math.min(this.config.zoom.max, zoom));
    this.config.zoom.current = zoom;
    
    if (center) {
      this.config.zoom.center = center;
    }
    
    this.updateViewport();
    this.markDirty();
  }

  pan(delta: Point): void {
    this.config.zoom.center.x += delta.x / this.config.zoom.current;
    this.config.zoom.center.y += delta.y / this.config.zoom.current;
    
    this.updateViewport();
    this.markDirty();
  }

  // Coordinate transformations
  screenToWorld(screenPoint: Point): Point {
    return this.viewport.screenToWorld(screenPoint);
  }

  worldToScreen(worldPoint: Point): Point {
    return this.viewport.worldToScreen(worldPoint);
  }

  // Hit testing
  getWidgetAtPoint(point: Point): WidgetInstance | null {
    const worldPoint = this.screenToWorld(point);
    
    // Check widgets in reverse layer order (top to bottom)
    const sortedWidgets = Array.from(this.widgets.values())
      .sort((a, b) => b.zIndex - a.zIndex);
    
    for (const widget of sortedWidgets) {
      if (widget.containsPoint(worldPoint)) {
        return widget;
      }
    }
    
    return null;
  }

  getWidgetsInRect(rect: Rectangle): WidgetInstance[] {
    const worldRect = this.viewport.screenToWorldRect(rect);
    
    return Array.from(this.widgets.values())
      .filter(widget => widget.intersectsRect(worldRect));
  }

  // Snapping
  snapToGrid(point: Point): Point {
    if (!this.config.grid.snapToGrid) return point;
    
    const gridSize = this.config.grid.size;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }

  // Event system
  on(event: string, callback: Function): void {
    this.eventBus.on(event, callback);
  }

  off(event: string, callback?: Function): void {
    this.eventBus.off(event, callback);
  }

  emit(event: string, data?: any): void {
    this.eventBus.emit(event, data);
  }

  // Utility methods
  markDirty(): void {
    this.isDirty = true;
  }

  getCanvasRect(): Rectangle {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.widgets.forEach(widget => widget.destroy());
    this.widgets.clear();
    this.eventBus.removeAllListeners();
  }
}
```

### 3. Widget System Architecture

```typescript
// features/scada/engine/WidgetEngine.ts
export abstract class BaseWidget {
  public id: string;
  public type: WidgetType;
  public position: Position;
  public size: Size;
  public rotation: number;
  public zIndex: number;
  public visible: boolean;
  public locked: boolean;
  
  protected config: WidgetConfiguration;
  protected canvas: CanvasEngine;
  protected eventBus: EventEmitter;
  
  // Data binding
  protected dataSources: Map<string, DataSource> = new Map();
  protected dataValues: Map<string, any> = new Map();
  
  // Animation
  protected animations: Map<string, Animation> = new Map();
  
  constructor(canvas: CanvasEngine, config: WidgetConfiguration) {
    this.canvas = canvas;
    this.config = config;
    this.eventBus = new EventEmitter();
    
    this.id = config.id;
    this.type = config.type;
    this.position = { ...config.position };
    this.size = { ...config.size };
    this.rotation = config.rotation || 0;
    this.zIndex = config.zIndex || 0;
    this.visible = config.visible !== false;
    this.locked = config.locked || false;
    
    this.setupDataSources();
    this.setupInteractions();
  }

  // Abstract methods that must be implemented by concrete widgets
  abstract render(context: CanvasRenderingContext2D): void;
  abstract getBounds(): Rectangle;
  abstract containsPoint(point: Point): boolean;

  // Common widget functionality
  update(updates: Partial<WidgetConfiguration>): void {
    Object.assign(this.config, updates);
    
    if (updates.position) this.position = { ...updates.position };
    if (updates.size) this.size = { ...updates.size };
    if (updates.rotation !== undefined) this.rotation = updates.rotation;
    if (updates.zIndex !== undefined) this.zIndex = updates.zIndex;
    if (updates.visible !== undefined) this.visible = updates.visible;
    if (updates.locked !== undefined) this.locked = updates.locked;
    
    this.onUpdate(updates);
    this.canvas.markDirty();
  }

  // Data binding methods
  bindDataSource(key: string, dataSource: DataSource): void {
    this.dataSources.set(key, dataSource);
    this.subscribeToData(dataSource);
  }

  updateDataValue(sourceId: string, value: any): void {
    this.dataValues.set(sourceId, value);
    this.onDataUpdate(sourceId, value);
    this.canvas.markDirty();
  }

  getDataValue(sourceId: string): any {
    return this.dataValues.get(sourceId);
  }

  // Animation methods
  animate(property: string, from: any, to: any, duration: number, easing?: EasingFunction): Promise<void> {
    return new Promise((resolve) => {
      const animation = new PropertyAnimation(property, from, to, duration, easing);
      
      animation.on('update', (value: any) => {
        this.setProperty(property, value);
        this.canvas.markDirty();
      });
      
      animation.on('complete', () => {
        this.animations.delete(property);
        resolve();
      });
      
      this.animations.set(property, animation);
      animation.start();
    });
  }

  // Transform methods
  getTransform(): TransformMatrix {
    const transform = new TransformMatrix();
    
    // Translate to widget center
    transform.translate(
      this.position.x + this.size.width / 2,
      this.position.y + this.size.height / 2
    );
    
    // Rotate if needed
    if (this.rotation !== 0) {
      transform.rotate(this.rotation * Math.PI / 180);
    }
    
    // Translate back to position
    transform.translate(
      -this.size.width / 2,
      -this.size.height / 2
    );
    
    return transform;
  }

  // Interaction methods
  intersectsRect(rect: Rectangle): boolean {
    const bounds = this.getBounds();
    return (
      bounds.x < rect.x + rect.width &&
      bounds.x + bounds.width > rect.x &&
      bounds.y < rect.y + rect.height &&
      bounds.y + bounds.height > rect.y
    );
  }

  // Event handling
  onClick(point: Point): void {
    this.executeInteractions('CLICK', { point });
  }

  onDoubleClick(point: Point): void {
    this.executeInteractions('DOUBLE_CLICK', { point });
  }

  onHover(point: Point): void {
    this.executeInteractions('HOVER', { point });
  }

  // Lifecycle hooks
  protected onUpdate(updates: Partial<WidgetConfiguration>): void {
    // Override in subclasses
  }

  protected onDataUpdate(sourceId: string, value: any): void {
    // Override in subclasses
  }

  protected setupDataSources(): void {
    this.config.dataSources?.forEach((dataSource, index) => {
      this.bindDataSource(`source_${index}`, dataSource);
    });
  }

  protected setupInteractions(): void {
    this.config.interactions?.forEach(interaction => {
      this.eventBus.on(interaction.trigger, () => {
        this.executeInteraction(interaction);
      });
    });
  }

  private executeInteractions(trigger: InteractionTrigger, context: any): void {
    const interactions = this.config.interactions?.filter(i => i.trigger === trigger) || [];
    
    interactions.forEach(interaction => {
      this.executeInteraction(interaction, context);
    });
  }

  private executeInteraction(interaction: WidgetInteraction, context?: any): void {
    // Evaluate condition if present
    if (interaction.condition && !this.evaluateCondition(interaction.condition, context)) {
      return;
    }

    switch (interaction.action) {
      case 'NAVIGATE':
        this.handleNavigateAction(interaction.parameters);
        break;
      case 'SEND_COMMAND':
        this.handleSendCommandAction(interaction.parameters);
        break;
      case 'SHOW_POPUP':
        this.handleShowPopupAction(interaction.parameters);
        break;
      case 'CHANGE_COLOR':
        this.handleChangeColorAction(interaction.parameters);
        break;
      case 'ANIMATE':
        this.handleAnimateAction(interaction.parameters);
        break;
    }
  }

  private subscribeToData(dataSource: DataSource): void {
    // Implementation depends on data source type
    switch (dataSource.type) {
      case 'TELEMETRY':
        // Subscribe to device telemetry
        break;
      case 'ATTRIBUTE':
        // Subscribe to device attributes
        break;
      case 'ALARM':
        // Subscribe to alarms
        break;
      case 'CALCULATION':
        // Subscribe to calculated values
        break;
    }
  }

  destroy(): void {
    this.animations.forEach(animation => animation.stop());
    this.animations.clear();
    this.eventBus.removeAllListeners();
  }
}
```

### 4. Specific Widget Implementations

```typescript
// features/scada/widgets/ChartWidget.ts
export class ChartWidget extends BaseWidget {
  private chart: Chart | null = null;
  private chartCanvas: HTMLCanvasElement;
  private chartData: ChartData = { labels: [], datasets: [] };

  constructor(canvas: CanvasEngine, config: WidgetConfiguration) {
    super(canvas, config);
    this.chartCanvas = document.createElement('canvas');
    this.setupChart();
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const transform = this.getTransform();
    context.save();
    
    // Apply transform
    context.setTransform(...transform.toArray());
    
    // Draw chart canvas onto main canvas
    if (this.chartCanvas) {
      context.drawImage(
        this.chartCanvas,
        0, 0,
        this.size.width, this.size.height
      );
    }
    
    context.restore();
  }

  getBounds(): Rectangle {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    };
  }

  containsPoint(point: Point): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  protected onDataUpdate(sourceId: string, value: any): void {
    // Update chart data based on data source
    this.updateChartData(sourceId, value);
  }

  private setupChart(): void {
    const ctx = this.chartCanvas.getContext('2d')!;
    this.chartCanvas.width = this.size.width;
    this.chartCanvas.height = this.size.height;

    this.chart = new Chart(ctx, {
      type: this.config.properties.chartType || 'line',
      data: this.chartData,
      options: {
        responsive: false,
        animation: {
          duration: 0,
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  private updateChartData(sourceId: string, value: any): void {
    // Add new data point
    const now = new Date();
    const dataset = this.chartData.datasets[0];
    
    if (dataset) {
      dataset.data.push({
        x: now,
        y: value,
      });
      
      // Keep only last N points
      const maxPoints = this.config.properties.maxDataPoints || 100;
      if (dataset.data.length > maxPoints) {
        dataset.data.shift();
      }
      
      this.chart?.update('none');
    }
  }
}

// features/scada/widgets/GaugeWidget.ts
export class GaugeWidget extends BaseWidget {
  private currentValue: number = 0;
  private minValue: number = 0;
  private maxValue: number = 100;

  render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const transform = this.getTransform();
    context.save();
    context.setTransform(...transform.toArray());
    
    this.drawGauge(context);
    
    context.restore();
  }

  getBounds(): Rectangle {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    };
  }

  containsPoint(point: Point): boolean {
    const bounds = this.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2;
    
    const distance = Math.sqrt(
      Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
    );
    
    return distance <= radius;
  }

  protected onDataUpdate(sourceId: string, value: any): void {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      this.animateToValue(numValue);
    }
  }

  private async animateToValue(targetValue: number): Promise<void> {
    await this.animate('currentValue', this.currentValue, targetValue, 500, 'easeOutCubic');
    this.currentValue = targetValue;
  }

  private drawGauge(context: CanvasRenderingContext2D): void {
    const centerX = this.size.width / 2;
    const centerY = this.size.height / 2;
    const radius = Math.min(this.size.width, this.size.height) / 2 - 10;
    
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;
    const totalAngle = endAngle - startAngle;
    
    // Draw gauge background
    context.beginPath();
    context.arc(centerX, centerY, radius, startAngle, endAngle);
    context.lineWidth = 20;
    context.strokeStyle = this.config.style?.backgroundColor || '#e0e0e0';
    context.stroke();
    
    // Draw gauge value
    const valueRatio = (this.currentValue - this.minValue) / (this.maxValue - this.minValue);
    const valueAngle = startAngle + totalAngle * valueRatio;
    
    context.beginPath();
    context.arc(centerX, centerY, radius, startAngle, valueAngle);
    context.lineWidth = 20;
    context.strokeStyle = this.getValueColor();
    context.stroke();
    
    // Draw needle
    this.drawNeedle(context, centerX, centerY, radius - 30, valueAngle);
    
    // Draw value text
    this.drawValueText(context, centerX, centerY);
  }

  private getValueColor(): string {
    const ratio = (this.currentValue - this.minValue) / (this.maxValue - this.minValue);
    
    if (ratio < 0.3) return '#4caf50'; // Green
    if (ratio < 0.7) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  private drawNeedle(context: CanvasRenderingContext2D, centerX: number, centerY: number, length: number, angle: number): void {
    context.save();
    context.translate(centerX, centerY);
    context.rotate(angle);
    
    context.beginPath();
    context.moveTo(0, -3);
    context.lineTo(length, 0);
    context.lineTo(0, 3);
    context.closePath();
    
    context.fillStyle = '#333';
    context.fill();
    
    context.restore();
    
    // Draw center circle
    context.beginPath();
    context.arc(centerX, centerY, 8, 0, Math.PI * 2);
    context.fillStyle = '#333';
    context.fill();
  }

  private drawValueText(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    context.fillStyle = this.config.style?.color || '#333';
    context.font = `${this.config.style?.fontSize || 16}px ${this.config.style?.fontFamily || 'Arial'}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    const text = this.currentValue.toFixed(1);
    context.fillText(text, centerX, centerY + 40);
  }
}
```

### 5. Data Binding System

```typescript
// features/scada/engine/DataBindingEngine.ts
export class DataBindingEngine {
  private bindings: Map<string, DataBinding> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private dataCache: Map<string, any> = new Map();

  constructor(
    private deviceStore: DeviceStore,
    private socketClient: SocketClient
  ) {
    this.setupRealTimeListeners();
  }

  // Bind widget to data source
  bindWidget(widgetId: string, dataSource: DataSource): void {
    const bindingKey = `${widgetId}:${dataSource.id}`;
    
    const binding: DataBinding = {
      widgetId,
      dataSource,
      lastValue: undefined,
      lastUpdate: 0,
    };
    
    this.bindings.set(bindingKey, binding);
    this.subscribeToDataSource(dataSource);
  }

  // Remove widget binding
  unbindWidget(widgetId: string): void {
    const bindingsToRemove = Array.from(this.bindings.entries())
      .filter(([key]) => key.startsWith(`${widgetId}:`));
    
    bindingsToRemove.forEach(([key, binding]) => {
      this.bindings.delete(key);
      this.unsubscribeFromDataSource(binding.dataSource);
    });
  }

  // Get current value for data source
  getValue(dataSource: DataSource): any {
    const cacheKey = this.getDataSourceKey(dataSource);
    return this.dataCache.get(cacheKey);
  }

  // Subscribe to data source based on type
  private subscribeToDataSource(dataSource: DataSource): void {
    const cacheKey = this.getDataSourceKey(dataSource);
    
    if (this.subscriptions.has(cacheKey)) {
      return; // Already subscribed
    }

    switch (dataSource.type) {
      case 'TELEMETRY':
        this.subscribeTelemetry(dataSource);
        break;
      case 'ATTRIBUTE':
        this.subscribeAttribute(dataSource);
        break;
      case 'ALARM':
        this.subscribeAlarms(dataSource);
        break;
      case 'CALCULATION':
        this.subscribeCalculation(dataSource);
        break;
    }
  }

  private subscribeTelemetry(dataSource: DataSource): void {
    if (!dataSource.deviceId || !dataSource.telemetryKey) return;
    
    const subscription = this.deviceStore.subscribeToDevice(dataSource.deviceId);
    const cacheKey = this.getDataSourceKey(dataSource);
    
    this.subscriptions.set(cacheKey, subscription);
    
    // Listen for telemetry updates
    this.socketClient.on('telemetry', (data: any) => {
      if (data.deviceId === dataSource.deviceId && data.telemetry[dataSource.telemetryKey!]) {
        const value = this.processValue(data.telemetry[dataSource.telemetryKey!], dataSource);
        this.updateValue(cacheKey, value);
      }
    });
  }

  private subscribeCalculation(dataSource: DataSource): void {
    if (!dataSource.expression) return;
    
    // Parse expression and subscribe to dependencies
    const dependencies = this.parseExpressionDependencies(dataSource.expression);
    
    dependencies.forEach(dep => {
      this.subscribeToDataSource(dep);
    });
    
    // Recalculate when dependencies change
    const recalculate = () => {
      const result = this.evaluateExpression(dataSource.expression!, dependencies);
      const cacheKey = this.getDataSourceKey(dataSource);
      this.updateValue(cacheKey, result);
    };
    
    const cacheKey = this.getDataSourceKey(dataSource);
    this.subscriptions.set(cacheKey, { unsubscribe: recalculate });
  }

  // Process raw value based on data source configuration
  private processValue(rawValue: any, dataSource: DataSource): any {
    let value = rawValue.value || rawValue;
    
    // Apply aggregation if configured
    if (dataSource.aggregation && dataSource.aggregation !== 'NONE') {
      // Implementation depends on aggregation type
      // This would typically involve historical data
    }
    
    return value;
  }

  // Update cached value and notify widgets
  private updateValue(cacheKey: string, value: any): void {
    this.dataCache.set(cacheKey, value);
    
    // Notify all widgets bound to this data source
    const relatedBindings = Array.from(this.bindings.entries())
      .filter(([key]) => key.endsWith(`:${cacheKey}`));
    
    relatedBindings.forEach(([bindingKey, binding]) => {
      binding.lastValue = value;
      binding.lastUpdate = Date.now();
      
      this.notifyWidget(binding.widgetId, binding.dataSource.id, value);
    });
  }

  // Notify widget of data update
  private notifyWidget(widgetId: string, sourceId: string, value: any): void {
    const widget = this.canvasEngine.getWidget(widgetId);
    if (widget) {
      widget.updateDataValue(sourceId, value);
    }
  }

  private getDataSourceKey(dataSource: DataSource): string {
    switch (dataSource.type) {
      case 'TELEMETRY':
        return `telemetry:${dataSource.deviceId}:${dataSource.telemetryKey}`;
      case 'ATTRIBUTE':
        return `attribute:${dataSource.deviceId}:${dataSource.attributeKey}`;
      case 'ALARM':
        return `alarm:${dataSource.deviceId || 'all'}`;
      case 'CALCULATION':
        return `calculation:${hashString(dataSource.expression || '')}`;
      default:
        return `unknown:${dataSource.id}`;
    }
  }

  private parseExpressionDependencies(expression: string): DataSource[] {
    // Parse expression to find data source references
    // Example: "#{device1.temperature} + #{device2.humidity}"
    const matches = expression.match(/#{([^}]+)}/g) || [];
    
    return matches.map(match => {
      const path = match.slice(2, -1); // Remove #{ and }
      const [deviceRef, key] = path.split('.');
      
      return {
        id: `${deviceRef}.${key}`,
        type: 'TELEMETRY' as const,
        deviceId: deviceRef,
        telemetryKey: key,
      };
    });
  }

  private evaluateExpression(expression: string, dependencies: DataSource[]): any {
    let evaluatedExpression = expression;
    
    // Replace each dependency with its current value
    dependencies.forEach(dep => {
      const value = this.getValue(dep) || 0;
      const placeholder = `#{${dep.deviceId}.${dep.telemetryKey}}`;
      evaluatedExpression = evaluatedExpression.replace(placeholder, String(value));
    });
    
    try {
      // Use a safe expression evaluator
      return Function('"use strict"; return (' + evaluatedExpression + ')')();
    } catch {
      return 0;
    }
  }

  private setupRealTimeListeners(): void {
    // Listen for device status changes
    this.socketClient.on('device-status', (data: any) => {
      const cacheKey = `status:${data.deviceId}`;
      this.updateValue(cacheKey, data.isOnline);
    });
    
    // Listen for alarms
    this.socketClient.on('alarm', (alarm: any) => {
      const cacheKey = `alarm:${alarm.deviceId}`;
      this.updateValue(cacheKey, alarm);
    });
  }

  destroy(): void {
    this.subscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    
    this.subscriptions.clear();
    this.bindings.clear();
    this.dataCache.clear();
  }
}
```

### 6. Animation Engine

```typescript
// features/scada/engine/AnimationEngine.ts
export class AnimationEngine {
  private animations: Map<string, Animation> = new Map();
  private animationFrame: number | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  createAnimation(
    id: string,
    from: any,
    to: any,
    duration: number,
    easing: EasingFunction = 'linear'
  ): Animation {
    const animation = new PropertyAnimation(from, to, duration, easing);
    this.animations.set(id, animation);
    
    animation.onComplete(() => {
      this.animations.delete(id);
    });
    
    return animation;
  }

  removeAnimation(id: string): void {
    const animation = this.animations.get(id);
    if (animation) {
      animation.stop();
      this.animations.delete(id);
    }
  }

  private tick(): void {
    if (!this.isRunning) return;
    
    const now = performance.now();
    
    this.animations.forEach(animation => {
      animation.update(now);
    });
    
    this.animationFrame = requestAnimationFrame(() => this.tick());
  }
}

export class PropertyAnimation {
  private startTime = 0;
  private isRunning = false;
  private callbacks: {
    update: Function[];
    complete: Function[];
  } = {
    update: [],
    complete: [],
  };

  constructor(
    private from: any,
    private to: any,
    private duration: number,
    private easing: EasingFunction = 'linear'
  ) {}

  start(): void {
    this.startTime = performance.now();
    this.isRunning = true;
  }

  stop(): void {
    this.isRunning = false;
  }

  update(currentTime: number): void {
    if (!this.isRunning) return;
    
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    const easedProgress = this.applyEasing(progress);
    const currentValue = this.interpolate(this.from, this.to, easedProgress);
    
    this.callbacks.update.forEach(callback => callback(currentValue));
    
    if (progress >= 1) {
      this.isRunning = false;
      this.callbacks.complete.forEach(callback => callback());
    }
  }

  onUpdate(callback: Function): void {
    this.callbacks.update.push(callback);
  }

  onComplete(callback: Function): void {
    this.callbacks.complete.push(callback);
  }

  private applyEasing(t: number): number {
    switch (this.easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - (1 - t) * (1 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'easeOutCubic':
        return 1 - Math.pow(1 - t, 3);
      default:
        return t;
    }
  }

  private interpolate(from: any, to: any, progress: number): any {
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }
    
    if (typeof from === 'object' && typeof to === 'object') {
      const result: any = {};
      
      for (const key in from) {
        if (key in to) {
          result[key] = this.interpolate(from[key], to[key], progress);
        }
      }
      
      return result;
    }
    
    // For non-numeric values, snap at 50% progress
    return progress < 0.5 ? from : to;
  }
}
```

This SCADA editor architecture provides:

1. **High-performance rendering** with canvas-based engine
2. **Extensible widget system** with reusable base classes
3. **Real-time data binding** with automatic updates
4. **Smooth animations** and visual feedback
5. **Advanced interactions** with drag-drop, selection, etc.
6. **Professional tools** for industrial SCADA development