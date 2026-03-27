export class FakeClassList {
  private readonly classes = new Set<string>();

  add(...names: string[]): void {
    for (const name of names) this.classes.add(name);
  }

  remove(...names: string[]): void {
    for (const name of names) this.classes.delete(name);
  }

  contains(name: string): boolean {
    return this.classes.has(name);
  }
}

export class FakeElement {
  id = '';
  textContent = '';
  readonly style: Record<string, string> = {};
  readonly dataset: Record<string, string> = {};
  readonly classList = new FakeClassList();
  readonly children: FakeElement[] = [];
  readonly attributes = new Map<string, string>();
  readonly listeners = new Map<string, Array<(this: FakeElement, event: { type: string }) => void>>();
  parent: FakeElement | null = null;
  ownerDocument: FakeDocument | null = null;
  private innerHtmlValue = '';

  constructor(readonly tagName: string) {}

  get innerHTML(): string {
    return this.innerHtmlValue;
  }

  set innerHTML(value: string) {
    this.innerHtmlValue = value;
    if (value === '') {
      this.children.length = 0;
      this.textContent = '';
    }
  }

  appendChild(child: FakeElement): FakeElement {
    child.parent = this;
    child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    if (child.id) this.ownerDocument?.register(child);
    return child;
  }

  remove(): void {
    if (!this.parent) return;
    const next = this.parent.children.filter(child => child !== this);
    this.parent.children.length = 0;
    this.parent.children.push(...next);
    this.parent = null;
  }

  addEventListener(type: string, listener: (this: FakeElement, event: { type: string }) => void): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  dispatch(type: string): void {
    const handlers = this.listeners.get(type) ?? [];
    for (const handler of handlers) {
      handler.call(this, { type });
    }
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'id') {
      this.id = value;
      this.ownerDocument?.register(this);
      return;
    }
    if (name === 'class') {
      for (const className of value.split(/\s+/).filter(Boolean)) {
        this.classList.add(className);
      }
      return;
    }
    if (name.startsWith('data-')) {
      const key = name
        .slice(5)
        .replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
      this.dataset[key] = value;
    }
  }

  getAttribute(name: string): string | null {
    if (name === 'id') return this.id || null;
    if (name.startsWith('data-')) {
      const key = name
        .slice(5)
        .replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
      return this.dataset[key] ?? null;
    }
    return this.attributes.get(name) ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const matches: FakeElement[] = [];
    for (const child of this.children) {
      if (matchesSelector(child, selector)) matches.push(child);
      matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  closest(selector: string): FakeElement | null {
    let current: FakeElement | null = this;
    while (current) {
      if (matchesSelector(current, selector)) return current;
      current = current.parent;
    }
    return null;
  }

  focus(): void {}

  getBoundingClientRect(): { width: number; height: number } {
    return { width: 0, height: 0 };
  }
}

export class FakeCanvasElement extends FakeElement {
  width = 0;
  height = 0;

  constructor(
    private readonly webglContext: Record<string, unknown>,
    private readonly context2d: Record<string, unknown>,
  ) {
    super('canvas');
  }

  getContext(kind: string): Record<string, unknown> | null {
    if (kind === 'webgl' || kind === 'experimental-webgl') return this.webglContext;
    if (kind === '2d') return this.context2d;
    return null;
  }
}

export class FakeDocument {
  readonly documentElement: FakeElement;
  readonly body: FakeElement;
  private readonly byId = new Map<string, FakeElement>();

  constructor(
    private readonly makeCanvas: () => FakeCanvasElement,
  ) {
    this.documentElement = new FakeElement('html');
    this.documentElement.ownerDocument = this;
    this.body = new FakeElement('body');
    this.body.ownerDocument = this;
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName: string): FakeElement {
    const element = tagName === 'canvas' ? this.makeCanvas() : new FakeElement(tagName);
    element.ownerDocument = this;
    return element;
  }

  register(element: FakeElement): void {
    if (element.id) this.byId.set(element.id, element);
  }

  getElementById(id: string): FakeElement | null {
    return this.byId.get(id) ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    return this.body.querySelectorAll(selector);
  }

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

function matchesSelector(element: FakeElement, selector: string): boolean {
  const classNames = [...selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(match => match[1]!);
  for (const className of classNames) {
    if (!element.classList.contains(className)) return false;
  }

  const attrNames = [...selector.matchAll(/\[([a-zA-Z0-9_-]+)\]/g)].map(match => match[1]!);
  for (const attrName of attrNames) {
    if (element.getAttribute(attrName) == null) return false;
  }

  return classNames.length > 0 || attrNames.length > 0;
}

function create2dContext(): Record<string, unknown> {
  return {
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    font: '',
    fillRect() {},
    fillText() {},
    measureText(text: string) {
      return { width: text.length * 12 };
    },
    beginPath() {},
    arc() {},
    fill() {},
    save() {},
    translate() {},
    scale() {},
    restore() {},
  };
}

export function createWebGLContext(): Record<string, unknown> {
  return {
    DEPTH_TEST: 0x0b71,
    CULL_FACE: 0x0b44,
    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x0100,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,
    TEXTURE_2D: 0x0de1,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812f,
    UNPACK_FLIP_Y_WEBGL: 0x9240,
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    createShader() { return {}; },
    shaderSource() {},
    compileShader() {},
    getShaderParameter() { return true; },
    getShaderInfoLog() { return ''; },
    createProgram() { return {}; },
    attachShader() {},
    linkProgram() {},
    getProgramParameter() { return true; },
    useProgram() {},
    getUniformLocation() { return {}; },
    uniform3f() {},
    uniform1i() {},
    uniformMatrix4fv() {},
    createBuffer() { return {}; },
    bindBuffer() {},
    bufferData() {},
    getAttribLocation() { return 0; },
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    createTexture() { return {}; },
    bindTexture() {},
    pixelStorei() {},
    texImage2D() {},
    texParameteri() {},
    viewport() {},
    clear() {},
    clearColor() {},
    enable() {},
    drawArrays() {},
  };
}

export function append(parent: FakeElement, child: FakeElement, document: FakeDocument): FakeElement {
  child.ownerDocument = document;
  parent.appendChild(child);
  if (child.id) document.register(child);
  return child;
}

export function makeElement(
  document: FakeDocument,
  tagName: string,
  options: {
    id?: string;
    classes?: string[];
    attrs?: Record<string, string>;
  } = {},
): FakeElement {
  const element = document.createElement(tagName);
  if (options.id) {
    element.id = options.id;
    document.register(element);
  }
  for (const className of options.classes ?? []) {
    element.classList.add(className);
  }
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    element.setAttribute(name, value);
  }
  return element;
}

export function createRenderRuntime(options: { reducedMotion?: boolean; webglContext?: Record<string, unknown> } = {}) {
  const document = new FakeDocument(() => new FakeCanvasElement(options.webglContext ?? createWebGLContext(), create2dContext()));
  const queuedFrames: Array<{ id: number; callback: () => void; cancelled: boolean }> = [];
  let nextFrameId = 1;

  return {
    document,
    window: {
      matchMedia: () => ({ matches: options.reducedMotion ?? true }),
      tag: undefined,
    } as Record<string, unknown>,
    getComputedStyle: (element: FakeElement) => ({
      getPropertyValue: (name: string) => element.style[name] ?? '',
    }),
    requestAnimationFrame: (callback: () => void) => {
      const id = nextFrameId++;
      queuedFrames.push({ id, callback, cancelled: false });
      return id;
    },
    cancelAnimationFrame: (id: number) => {
      const frame = queuedFrames.find(entry => entry.id === id);
      if (frame) frame.cancelled = true;
    },
    flushAnimationFrames: (limit = 240) => {
      let processed = 0;
      while (processed < limit) {
        const frame = queuedFrames.shift();
        if (!frame) return;
        if (frame.cancelled) continue;
        processed += 1;
        frame.callback();
      }
      if (queuedFrames.some(frame => !frame.cancelled)) {
        throw new Error(`Animation frames did not settle within ${limit} steps.`);
      }
    },
  };
}

export function executeGeneratedCode(
  code: string,
  env: ReturnType<typeof createRenderRuntime>,
  bindings: Record<string, unknown> = {},
): void {
  const bindingNames = Object.keys(bindings);
  const runner = new Function(
    'window',
    'document',
    'getComputedStyle',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    ...bindingNames,
    code,
  );
  runner(
    env.window,
    env.document,
    env.getComputedStyle,
    env.requestAnimationFrame,
    env.cancelAnimationFrame,
    ...bindingNames.map(name => bindings[name]),
  );
}
