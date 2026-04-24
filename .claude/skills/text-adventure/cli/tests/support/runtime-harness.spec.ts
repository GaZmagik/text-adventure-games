import { describe, test, expect } from 'bun:test';
import { append, createRenderRuntime, createWebGLContext, executeGeneratedCode, makeElement } from './runtime-harness';

describe('runtime harness', () => {
  test('supports DOM-style registration, querying, attributes, and removal', () => {
    const env = createRenderRuntime();
    const container = append(
      env.document.body,
      makeElement(env.document, 'section', { id: 'root', classes: ['container'] }),
      env.document,
    );
    const child = append(
      container,
      makeElement(env.document, 'div', {
        id: 'child',
        classes: ['match'],
        attrs: {
          'data-role': 'button',
          title: 'Trigger',
        },
      }),
      env.document,
    );
    child.textContent = 'ready';
    child.innerHTML = '<strong>ready</strong>';
    expect(child.innerHTML).toBe('<strong>ready</strong>');
    child.innerHTML = '';
    const nested = append(child, makeElement(env.document, 'span', { classes: ['match'] }), env.document);

    expect(child.textContent).toBe('');
    expect(child.children).toHaveLength(1);
    expect(env.document.getElementById('child')).toBe(child);
    expect(env.document.querySelector('.container')).toBe(container);
    expect(env.document.querySelectorAll('.match')).toEqual([child, nested]);
    expect(env.document.querySelector('[title]')).toBe(child);
    expect(container.querySelector('.match')).toBe(child);
    expect(container.querySelectorAll('.match')).toEqual([child, nested]);
    expect(child.getAttribute('data-role')).toBe('button');
    expect(child.dataset.role).toBe('button');
    child.setAttribute('data-roll-total', '17');
    expect(child.dataset.rollTotal).toBe('17');
    expect(child.getAttribute('data-roll-total')).toBe('17');
    expect(nested.closest('.container')).toBe(container);
    expect(child.getBoundingClientRect()).toEqual({ width: 0, height: 0 });
    expect(() => child.focus()).not.toThrow();
    const events: string[] = [];
    child.addEventListener('activate', event => events.push(event.type));
    child.dispatch('activate');
    expect(events).toEqual(['activate']);

    child.classList.remove('match');
    expect(child.classList.contains('match')).toBe(false);
    child.classList.add('match');

    nested.remove();
    expect(child.children).toHaveLength(0);

    child.remove();
    expect(container.children).toHaveLength(0);
    expect(() => child.remove()).not.toThrow();
  });

  test('exposes canvas contexts used by generated render code', () => {
    const customWebGL = { sentinel: true };
    const env = createRenderRuntime({ webglContext: customWebGL });
    const canvas = env.document.createElement('canvas') as any;
    const context2d = canvas.getContext('2d') as any;

    expect(canvas.getContext('webgl')).toBe(customWebGL);
    expect(canvas.getContext('experimental-webgl')).toBe(customWebGL);
    expect(canvas.getContext('unknown')).toBeNull();
    expect(context2d.measureText('abc')).toEqual({ width: 36 });

    context2d.fillRect();
    context2d.fillText();
    context2d.beginPath();
    context2d.arc();
    context2d.fill();
    context2d.save();
    context2d.translate();
    context2d.scale();
    context2d.restore();
  });

  test('provides the WebGL method surface expected by generated widgets', () => {
    const gl = createWebGLContext() as any;
    const shader = gl.createShader();
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();

    expect(shader).toEqual({});
    expect(program).toEqual({});
    expect(buffer).toEqual({});
    expect(texture).toEqual({});
    expect(gl.getShaderParameter()).toBe(true);
    expect(gl.getShaderInfoLog()).toBe('');
    expect(gl.getProgramParameter()).toBe(true);
    expect(gl.getUniformLocation()).toEqual({});
    expect(gl.getAttribLocation()).toBe(0);

    gl.shaderSource(shader, 'void main(){}');
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.uniform3f({}, 0, 0, 0);
    gl.uniform1i({}, 0);
    gl.uniformMatrix4fv({}, false, []);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, [], gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, {});
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.viewport(0, 0, 320, 240);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });

  test('schedules, cancels, and guards animation frames', () => {
    const env = createRenderRuntime({ reducedMotion: false });
    const calls: string[] = [];
    const matchMedia = env.window.matchMedia as (query: string) => { matches: boolean };

    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);

    const cancelledId = env.requestAnimationFrame(() => calls.push('cancelled'));
    env.requestAnimationFrame(() => calls.push('ran'));
    env.cancelAnimationFrame(cancelledId);
    env.flushAnimationFrames();

    expect(calls).toEqual(['ran']);

    env.requestAnimationFrame(function requeue() {
      env.requestAnimationFrame(requeue);
    });

    expect(() => env.flushAnimationFrames(2)).toThrow('Animation frames did not settle within 2 steps.');
  });

  test('executes generated code with runtime globals and bindings', () => {
    const env = createRenderRuntime({ reducedMotion: false });
    env.document.body.style['--mode'] = 'test';

    expect(env.getComputedStyle(env.document.body).getPropertyValue('--mode')).toBe('test');

    executeGeneratedCode(
      `
        window.tag = BINDING_VALUE;
        const node = document.createElement('div');
        node.setAttribute('id', 'generated');
        node.setAttribute('data-mode', getComputedStyle(document.body).getPropertyValue('--mode') || 'unset');
        document.body.appendChild(node);
        requestAnimationFrame(() => node.setAttribute('data-frame', 'ran'));
      `,
      env,
      { BINDING_VALUE: 'ready' },
    );

    const generated = env.document.getElementById('generated');

    expect(env.window.tag).toBe('ready');
    expect(generated).not.toBeNull();
    expect(generated?.getAttribute('data-mode')).toBe('test');

    env.flushAnimationFrames();
    expect(generated?.getAttribute('data-frame')).toBe('ran');
  });
});
