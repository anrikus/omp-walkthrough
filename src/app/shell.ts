import { PresentationPlayer, type PlayerState } from '../engine/player';
import { chapters, cues, formatTime } from './data';
import { button, element, link } from './dom';
import { citationList, createEvidenceDialog, renderReferences } from './evidence';

export function mountApp(root: HTMLElement): () => void {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let motionOverride: boolean | null = null;
  let captionsEnabled = true;
  let shortcutsEnabled = true;
  let scrubberDragging = false;
  let started = false;
  let autoAdvance = false;
  let routeVersion = 0;
  let playbackIntent = 0;
  let fullscreenMessage = '';
  let currentRoute = '';
  let lastChapterHash = chapters[0] ? `#${chapters[0].id}` : '';
  let returnPosition: { hash: string; time: number } | null = null;
  let pageCleanup = () => {};
  let captionId = '';
  let evidenceId = '';
  let selectedChapter = '';

  root.classList.add('theater-app');
  const skip = link('Skip to content', '#presentation-content', 'skip-link');
  const header = element('header', 'app-header');
  const identity = link('The Harness Layer', chapters[0] ? `#${chapters[0].id}` : '#atlas', 'app-identity');
  const subtitle = element('span', 'app-subtitle', 'An evidence-based introduction to omp');
  const primary = element('nav', 'primary-nav');
  primary.setAttribute('aria-label', 'Primary');
  const presentationLink = link('Presentation', chapters[0] ? `#${chapters[0].id}` : '#atlas');
  primary.append(presentationLink, link('Feature Atlas', '#atlas'), link('References', '#references'));
  if (import.meta.env.DEV) primary.append(link('Visual kit', '#kit'));
  const layout = element('div', 'app-layout');
  const drawer = element('dialog', 'chapter-drawer');
  drawer.id = 'chapter-drawer';
  drawer.setAttribute('aria-labelledby', 'chapter-drawer-title');
  let drawerOpener: HTMLElement | null = null;
  const menuToggle = button('Chapters', toggleDrawer, 'chapter-menu-toggle');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-controls', drawer.id);
  menuToggle.setAttribute('aria-haspopup', 'dialog');
  menuToggle.setAttribute('aria-keyshortcuts', 'M');
  const drawerHeader = element('div', 'dialog-header');
  const drawerTitle = element('h2', '', 'Chapters');
  drawerTitle.id = 'chapter-drawer-title';
  const closeDrawerButton = button('Close', closeDrawer, 'quiet-button');
  closeDrawerButton.autofocus = true;
  drawerHeader.append(drawerTitle, closeDrawerButton);
  const drawerBody = element('div', 'chapter-drawer-body');
  drawer.append(drawerHeader, drawerBody);
  drawer.addEventListener('close', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    if (drawer.contains(document.activeElement) || document.activeElement === document.body) {
      (drawerOpener?.isConnected ? drawerOpener : menuToggle).focus({ preventScroll: true });
    }
  });
  drawer.addEventListener('click', event => {
    if (event.target !== drawer) return;
    const bounds = drawer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDrawer();
  });
  header.append(identity, subtitle, menuToggle, primary);
  const chapterNav = element('nav', 'chapter-nav');
  chapterNav.id = 'chapter-list';
  chapterNav.setAttribute('aria-label', 'Chapters');
  const chapterLinks = new Map<string, HTMLAnchorElement>();
  for (const act of new Set(chapters.map(chapter => chapter.act))) {
    const section = element('section', 'chapter-act');
    section.append(element('h2', '', act));
    const list = element('ol', 'chapter-list');
    for (const chapter of chapters.filter(item => item.act === act)) {
      const item = element('li');
      const anchor = link('', `#${chapter.id}`, 'chapter-link');
      const number = element('span', 'chapter-number', chapter.id.slice(2));
      const label = element('span', 'chapter-label', chapter.title);
      const duration = cues.get(chapter.id)?.duration;
      const time = element('span', 'chapter-duration', `${duration === undefined ? '~' : ''}${formatTime(duration ?? chapter.targetSeconds)}`);
      anchor.append(number, label, time);
      anchor.addEventListener('click', event => {
        closeDrawer();
        if (anchor.hash === location.hash) { event.preventDefault(); void route(); }
      });
      chapterLinks.set(chapter.id, anchor);
      item.append(anchor);
      list.append(item);
    }
    section.append(list);
    chapterNav.append(section);
  }
  const totalSeconds = chapters.reduce((sum, chapter) => sum + (cues.get(chapter.id)?.duration ?? chapter.targetSeconds), 0);
  const presentationLength = element('p', 'presentation-length', `${chapters.length} chapters · ${formatTime(totalSeconds)}`);

  const main = element('main', 'app-main');
  main.id = 'presentation-content';
  main.tabIndex = -1;
  const presentation = element('div', 'presentation');
  const chapterHeader = element('div', 'chapter-header visually-hidden');
  const chapterTitle = element('h1', 'chapter-title');
  chapterTitle.tabIndex = -1;
  const sceneTitle = element('p', 'current-scene');
  chapterHeader.append(chapterTitle, sceneTitle);
  const stageArea = element('div', 'stage-area');
  const stageViewport = element('div', 'stage-viewport');
  const stage = element('div', 'presentation-stage');
  stage.id = 'stage';
  stageViewport.append(stage);
  const caption = element('div', 'caption-region');
  const captionDock = element('div', 'caption-dock');
  caption.setAttribute('aria-label', 'Captions');
  const captionText = element('p', 'caption-text');
  caption.append(captionText);
  const liveEvidence = element('div', 'live-evidence');
  liveEvidence.setAttribute('aria-label', 'Current sentence evidence');
  captionDock.append(caption, liveEvidence);
  const captionProbe = element('div', 'caption-measurement');
  captionProbe.setAttribute('aria-hidden', 'true');
  captionProbe.inert = true;
  let captionFrame = 0;
  let captionWidth = 0;
  let captionFontVersion = 0;
  let measuredCaptionKey = '';
  let disposed = false;

  function scheduleCaptionMeasurement(): void {
    if (disposed || captionFrame || !captionsEnabled || presentation.hidden) return;
    captionFrame = requestAnimationFrame(() => {
      captionFrame = 0;
      if (disposed || !captionsEnabled || presentation.hidden || captionWidth <= 0 || !selectedChapter) return;
      const key = `${selectedChapter}:${captionWidth}:${captionFontVersion}`;
      if (key === measuredCaptionKey) return;
      captionProbe.style.width = `${captionWidth}px`;
      // All sentences share one grid cell: its intrinsic height is the chapter maximum.
      const height = Math.ceil(captionProbe.getBoundingClientRect().height);
      presentation.style.setProperty('--caption-text-height', `${height}px`);
      measuredCaptionKey = key;
    });
  }
  stageArea.append(stageViewport);
  const transport = element('section', 'transport');
  transport.setAttribute('aria-label', 'Playback controls');
  const controls = element('div', 'transport-controls');
  const play = button('Play', () => { void togglePlayback(); }, 'play-button');
  play.setAttribute('aria-keyshortcuts', 'Space');
  const back = button('−5 s', () => player.seek((player.state?.time ?? 0) - 5), 'seek-button');
  back.setAttribute('aria-label', '−5 s: back five seconds');
  back.setAttribute('aria-keyshortcuts', 'ArrowLeft');
  const forward = button('+5 s', () => player.seek((player.state?.time ?? 0) + 5), 'seek-button');
  forward.setAttribute('aria-label', '+5 s: forward five seconds');
  forward.setAttribute('aria-keyshortcuts', 'ArrowRight');
  const time = element('output', 'chapter-time', '0:00 / 0:00');
  time.setAttribute('role', 'timer');
  time.setAttribute('aria-live', 'off');
  const captions = button('Captions', () => setCaptions(!captionsEnabled), 'quiet-button');
  captions.setAttribute('aria-pressed', 'true');
  captions.setAttribute('aria-keyshortcuts', 'C');
  const motion = button('Reduce motion', () => {
    motionOverride = !player.reducedMotion;
    updateMotion();
  }, 'quiet-button');
  const references = link('References', '#references', 'quiet-button');
  references.setAttribute('aria-keyshortcuts', 'R');
  const fullscreen = button('Fullscreen', () => { void toggleFullscreen(); }, 'quiet-button fullscreen-button');
  fullscreen.setAttribute('aria-keyshortcuts', 'F');
  fullscreen.setAttribute('aria-pressed', 'false');
  const timeline = element('div', 'timeline');
  const scrubber = element('input', 'scrubber');
  scrubber.type = 'range';
  scrubber.min = '0';
  scrubber.max = '0';
  scrubber.step = '1';
  scrubber.value = '0';
  scrubber.setAttribute('aria-label', 'Chapter time');
  scrubber.addEventListener('input', () => player.seek(Number(scrubber.value)));
  scrubber.addEventListener('pointerdown', () => { scrubberDragging = true; });
  const endScrub = () => {
    if (!scrubberDragging) return;
    scrubberDragging = false;
    if (player.state) renderFrame(player.state);
  };
  window.addEventListener('pointerup', endScrub);
  window.addEventListener('pointercancel', endScrub);
  const ticks = element('div', 'scene-ticks');
  timeline.append(scrubber, ticks);
  controls.append(play, back, forward, timeline, time, captions, motion, references, fullscreen);
  const notice = element('p', 'playback-notice');
  notice.setAttribute('role', 'status');
  const transcript = element('details', 'chapter-transcript');
  transcript.append(element('summary', '', 'Chapter transcript and scene links'));
  const transcriptBody = element('div', 'transcript-body');
  transcript.append(transcriptBody);
  transcriptBody.addEventListener('click', event => {
    const anchor = event.target instanceof Element ? event.target.closest('a') : null;
    if (anchor) closeDrawer();
    if (anchor?.hash === location.hash) { event.preventDefault(); void route(); }
  });
  transport.append(controls);
  stageArea.append(notice);
  presentation.append(chapterHeader, stageArea, captionDock, transport);
  const page = element('div', 'content-page');
  main.append(presentation, page);
  layout.append(main);
  const footer = element('footer', 'independence-footer', 'Independent community explainer · not affiliated with Stencil Labs · facts as of 2026-10-08');
  const shortcutToggle = button('Single-key shortcuts', () => {
    shortcutsEnabled = !shortcutsEnabled;
    shortcutToggle.setAttribute('aria-pressed', String(shortcutsEnabled));
    for (const [control, key] of [[captions, 'C'], [references, 'R'], [menuToggle, 'M'], [fullscreen, 'F']] as const) {
      if (shortcutsEnabled) control.setAttribute('aria-keyshortcuts', key);
      else control.removeAttribute('aria-keyshortcuts');
    }
  }, 'shortcut-toggle');
  shortcutToggle.setAttribute('aria-pressed', 'true');
  const shortcutHelp = element('p', 'shortcut-help', 'Space: play or pause. Arrow keys: seek five seconds. C: captions. R: references. M: chapters. F: fullscreen. Escape closes a dialog or exits browser fullscreen.');
  drawerBody.append(presentationLength, shortcutToggle, shortcutHelp, transcript, chapterNav);
  const evidence = createEvidenceDialog(() => { ++playbackIntent; autoAdvance = false; player.pause(); });
  const player = new PresentationPlayer(stage, {
    cite: evidence.cite,
    onFrame: renderFrame,
    onError: message => { notice.textContent = message; },
    onEnded: () => {
      if (!started || !player.state || !currentRoute.startsWith('#ch')) return;
      const index = chapters.findIndex(chapter => chapter.id === player.state?.chapter.id);
      const next = chapters[index + 1];
      if (next) { autoAdvance = true; location.hash = next.id; }
      else { autoAdvance = false; notice.textContent = 'Presentation complete. Explore the Feature Atlas or inspect the references.'; }
    },
  });
  liveEvidence.addEventListener('focusout', () => queueMicrotask(() => {
    if (player.state) renderFrame(player.state);
  }));
  root.append(skip, header, layout, footer, drawer, evidence.dialog, captionProbe);
  skip.addEventListener('click', event => { event.preventDefault(); main.focus(); });

  function closeDrawer(): void {
    if (!drawer.open) return;
    drawer.close();
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleDrawer(): void {
    if (drawer.open) { closeDrawer(); return; }
    const active = document.activeElement;
    drawerOpener = active instanceof HTMLElement && active !== document.body ? active : menuToggle;
    ++playbackIntent;
    autoAdvance = false;
    player.pause();
    drawer.showModal();
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function syncFullscreen(): void {
    const active = document.fullscreenElement === root;
    fullscreen.setAttribute('aria-pressed', String(active));
    fullscreen.title = document.fullscreenEnabled ? 'Toggle fullscreen (F)' : 'Fullscreen is unavailable in this browser or embedding context';
  }

  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen();
      else if (document.fullscreenEnabled && typeof root.requestFullscreen === 'function') await root.requestFullscreen();
      else {
        fullscreenMessage = 'Fullscreen is unavailable in this browser or embedding context. The presentation remains usable in this window.';
        notice.textContent = fullscreenMessage;
        return;
      }
      if (notice.textContent === fullscreenMessage) notice.textContent = '';
      fullscreenMessage = '';
    } catch (error) {
      fullscreenMessage = `Fullscreen could not change: ${error instanceof Error ? error.message : String(error)}. Continue in this window or try the Fullscreen button again.`;
      notice.textContent = fullscreenMessage;
    }
    syncFullscreen();
  }

  function setCaptions(enabled: boolean): void {
    const active = document.activeElement;
    const focusedEvidence = active instanceof HTMLElement && liveEvidence.contains(active) ? active : null;
    captionsEnabled = enabled;
    captionDock.hidden = !enabled;
    presentation.classList.toggle('captions-hidden', !enabled);
    if (enabled) captionDock.append(liveEvidence);
    else controls.append(liveEvidence);
    focusedEvidence?.focus({ preventScroll: true });
    captions.setAttribute('aria-pressed', String(enabled));
    if (enabled) scheduleCaptionMeasurement();
  }

  function updateMotion(): void {
    player.reducedMotion = motionOverride ?? preference.matches;
    motion.setAttribute('aria-pressed', String(player.reducedMotion));
    root.dataset.reducedMotion = String(player.reducedMotion);
    if (currentRoute.startsWith('#atlas')) void route();
  }

  async function startPlayback(): Promise<void> {
    if (!player.state?.cues || player.state.playing) return;
    closeDrawer();
    try {
      await player.play();
      if (player.state?.playing) {
        started = true;
        notice.textContent = '';
      }
    } catch (error) {
      notice.textContent = `Playback could not start: ${error instanceof Error ? error.message : String(error)}. Use Play to try again.`;
    }
  }

  async function togglePlayback(): Promise<void> {
    ++playbackIntent;
    autoAdvance = false;
    if (player.state?.playing) player.pause();
    else await startPlayback();
  }

  function renderFrame(state: PlayerState): void {
    if (state.playing && drawer.open) closeDrawer();
    if (selectedChapter !== state.chapter.id) {
      selectedChapter = state.chapter.id;
      captionId = '';
      evidenceId = '';
      captionText.textContent = '';
      liveEvidence.replaceChildren();
      captionProbe.replaceChildren(...state.chapter.scenes.flatMap(scene =>
        scene.sentences.map(sentence => element('p', 'caption-text', sentence.text))));
      scheduleCaptionMeasurement();
      chapterTitle.textContent = state.chapter.title;
      ticks.replaceChildren();
      transcriptBody.replaceChildren();
      for (const scene of state.chapter.scenes) {
        const span = state.cues?.scenes.find(item => item.id === scene.id);
        if (span && state.duration > 0) {
          const tick = button('', () => player.seek(span.start), 'scene-tick');
          tick.style.left = `${span.start / state.duration * 100}%`;
          tick.setAttribute('aria-label', `Seek to scene ${scene.id}: ${scene.title}`);
          ticks.append(tick);
        }
        const section = element('section', 'transcript-scene');
        const heading = element('h2');
        heading.append(link(`${scene.id} ${scene.title}`, `#${state.chapter.id}/${scene.id}`));
        section.append(heading);
        for (const sentence of scene.sentences) {
          const paragraph = element('p', '', sentence.text);
          section.append(paragraph, citationList(sentence, evidence.cite));
        }
        transcriptBody.append(section);
      }
      for (const [id, anchor] of chapterLinks) {
        if (id === state.chapter.id) anchor.setAttribute('aria-current', 'page');
        else anchor.removeAttribute('aria-current');
      }
    }
    sceneTitle.textContent = `${state.scene.id} · ${state.scene.title}`;
    stage.dataset.scene = state.scene.id;
    stage.dataset.time = state.time.toFixed(3);
    time.value = `${formatTime(state.time)} / ${formatTime(state.duration)}`;
    scrubber.max = String(state.duration);
    if (!scrubberDragging) scrubber.value = String(state.time);
    scrubber.setAttribute('aria-valuetext', `${formatTime(state.time)} of ${formatTime(state.duration)}`);
    play.textContent = state.playing ? 'Pause' : 'Play';
    play.setAttribute('aria-label', state.playing ? 'Pause narration' : 'Play narration');
    for (const control of [play, back, forward, scrubber]) control.disabled = !state.cues;
    let displaySentence = state.sentence;
    if (!displaySentence && state.cues) {
      for (const cue of state.cues.sentences) {
        if (cue.scene === state.scene.id && cue.start <= state.time) {
          displaySentence = state.scene.sentences.find(sentence => sentence.id === cue.id) ?? null;
        }
      }
    }
    const newCaptionId = displaySentence?.id ?? '';
    if (newCaptionId !== captionId) {
      captionId = newCaptionId;
      captionText.textContent = displaySentence?.text ?? '';
    }
    if (newCaptionId !== evidenceId && !evidence.dialog.open && !liveEvidence.contains(document.activeElement)) {
      evidenceId = newCaptionId;
      liveEvidence.replaceChildren();
      if (displaySentence) liveEvidence.append(citationList(displaySentence, evidence.cite));
    }
  }

  async function route(): Promise<void> {
    const version = ++routeVersion;
    const previousRoute = currentRoute;
    if (previousRoute.startsWith('#ch') && player.state) returnPosition = { hash: previousRoute, time: player.state.time };
    const shouldResume = autoAdvance;
    const resumeIntent = playbackIntent;
    autoAdvance = false;
    player.pause();
    pageCleanup();
    pageCleanup = () => {};
    evidence.close();
    closeDrawer();
    const hash = location.hash || (chapters[0] ? `#${chapters[0].id}` : '#atlas');
    currentRoute = hash;
    const [routeId, detail] = hash.slice(1).split('/');
    const chapter = chapters.find(item => item.id === routeId);
    notice.textContent = '';
    page.replaceChildren();
    page.hidden = Boolean(chapter);
    presentation.hidden = !chapter;
    const readerMode = !chapter || Boolean(detail && !chapter.scenes.some(scene => scene.id === detail));
    main.classList.toggle('is-reader', readerMode);
    root.classList.toggle('is-reader', readerMode);
    if (!readerMode) scheduleCaptionMeasurement();
    main.scrollTop = 0;
    if (chapter) {
      if (detail && !chapter.scenes.some(scene => scene.id === detail)) {
        presentation.hidden = true;
        page.hidden = false;
        page.append(element('h1', '', 'Scene not found'), element('p', '', `Chapter ${chapter.id} has no scene “${detail}”.`), link('Start this chapter', `#${chapter.id}`));
      } else {
        lastChapterHash = hash;
        identity.href = hash;
        presentationLink.href = hash;
        const chapterCues = cues.get(chapter.id) ?? null;
        if (!chapterCues) notice.textContent = 'Narration audio is not available in this build. Browse the static scenes or read the chapter transcript.';
        try {
          await player.select(chapter, chapterCues, detail);
          if (version !== routeVersion) return;
          if (!previousRoute.startsWith('#ch') && returnPosition?.hash === hash) player.seek(returnPosition.time);
          document.title = `${chapter.title} · The Harness Layer`;
          if (shouldResume && resumeIntent === playbackIntent && !drawer.open && !evidence.dialog.open) await startPlayback();
        } catch (error) {
          if (version === routeVersion) notice.textContent = `Chapter could not load: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    } else if (routeId === 'references') {
      const loading = element('p', '', 'Loading references…');
      loading.setAttribute('role', 'status');
      const returnLink = lastChapterHash ? link('Return to presentation', lastChapterHash, 'back-link') : null;
      page.append(element('h1', '', 'References'), loading);
      if (returnLink) page.prepend(returnLink);
      document.title = 'References · The Harness Layer';
      try {
        const content = await renderReferences();
        if (version !== routeVersion) return;
        page.replaceChildren(content);
        if (returnLink) page.prepend(returnLink);
      } catch (error) {
        if (version !== routeVersion) return;
        loading.className = 'error-message';
        loading.setAttribute('role', 'alert');
        loading.textContent = `References could not load: ${error instanceof Error ? error.message : String(error)}. Check your connection and reload this page to try again.`;
        page.append(button('Reload page', () => location.reload(), 'secondary-button'));
      }
    } else if (routeId === 'atlas') {
      const loading = element('p', '', 'Loading the Feature Atlas…');
      loading.setAttribute('role', 'status');
      page.append(element('h1', '', 'Feature Atlas'), loading);
      document.title = 'Feature Atlas · The Harness Layer';
      try {
        const { renderAtlas } = await import('./atlas');
        if (version !== routeVersion) return;
        page.replaceChildren();
        pageCleanup = renderAtlas(page, detail, evidence.cite, () => player.reducedMotion);
      } catch (error) {
        if (version !== routeVersion) return;
        const message = element('p', 'error-message', `The Feature Atlas could not load: ${error instanceof Error ? error.message : String(error)}. Check your connection and reload this page to try again.`);
        message.setAttribute('role', 'alert');
        page.replaceChildren(element('h1', '', 'Feature Atlas unavailable'), message, button('Reload page', () => location.reload(), 'secondary-button'));
      }
    } else if (routeId === 'kit' && import.meta.env.DEV) {
      try {
        const { default: mountGallery } = await import('../kit/gallery');
        if (version !== routeVersion) return;
        pageCleanup = mountGallery(page);
        document.title = 'Visual kit · The Harness Layer';
      } catch (error) {
        if (version !== routeVersion) return;
        const message = element('p', 'error-message', `The visual kit could not load: ${error instanceof Error ? error.message : String(error)}. Check your connection and reload this page to try again.`);
        message.setAttribute('role', 'alert');
        page.replaceChildren(element('h1', '', 'Visual kit unavailable'), message, button('Reload page', () => location.reload(), 'secondary-button'));
      }
    } else {
      page.append(element('h1', '', 'Page not found'), element('p', '', 'Choose a chapter, open the Feature Atlas, or browse the references.'));
    }
    if (version !== routeVersion) return;
    const heading = (presentation.hidden ? page : presentation).querySelector<HTMLElement>('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }

  function keyboard(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented || evidence.dialog.open) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest('input:not([type="range"]), textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    const key = event.key.toLowerCase();
    if (drawer.open) {
      if (shortcutsEnabled && key === 'm') { event.preventDefault(); if (!event.repeat) closeDrawer(); }
      return;
    }
    if (event.key === 'Escape') {
      if (!document.fullscreenElement && currentRoute === '#references' && lastChapterHash) location.hash = lastChapterHash;
      return;
    }
    if (shortcutsEnabled && key === 'm') { event.preventDefault(); if (!event.repeat) toggleDrawer(); return; }
    if (shortcutsEnabled && key === 'r') { event.preventDefault(); if (!event.repeat) location.hash = currentRoute === '#references' ? lastChapterHash : '#references'; return; }
    if (presentation.hidden) return;
    if (shortcutsEnabled && key === 'c') { event.preventDefault(); if (!event.repeat) setCaptions(!captionsEnabled); return; }
    if (shortcutsEnabled && key === 'f') { event.preventDefault(); if (!event.repeat) void toggleFullscreen(); return; }
    if (target && liveEvidence.contains(target)) return;
    if (event.key === ' ' && !target?.closest('button, a, summary, input')) { event.preventDefault(); if (!event.repeat) void togglePlayback(); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || (target === scrubber && ['ArrowUp', 'ArrowDown'].includes(event.key))) {
      event.preventDefault();
      player.seek((player.state?.time ?? 0) + (['ArrowLeft', 'ArrowDown'].includes(event.key) ? -5 : 5));
    }
  }

  const ensureVisible = (event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !main.classList.contains('is-reader')) return;
    const bounds = target.getBoundingClientRect();
    const visible = main.getBoundingClientRect();
    if (bounds.top < visible.top + 12 || bounds.bottom > visible.bottom - 12) target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  main.addEventListener('focusin', ensureVisible);

  let fitFrame = 0;
  let availableWidth = 0;
  let availableHeight = 0;
  let appliedScale = -1;
  const fitStage = () => {
    fitFrame = 0;
    if (availableWidth <= 0 || availableHeight <= 0) return;
    const scale = Math.min(availableWidth / 1920, availableHeight / 1080);
    if (scale === appliedScale) return;
    appliedScale = scale;
    stage.style.transform = `scale(${scale})`;
    stageViewport.style.width = `${1920 * scale}px`;
    stageViewport.style.height = `${1080 * scale}px`;
  };
  const resize = new ResizeObserver(entries => {
    const entry = entries[entries.length - 1];
    if (!entry) return;
    availableWidth = entry.contentRect.width;
    availableHeight = entry.contentRect.height;
    if (!fitFrame) fitFrame = requestAnimationFrame(fitStage);
  });
  resize.observe(stageArea);
  const captionResize = new ResizeObserver(entries => {
    const width = entries[entries.length - 1]?.contentRect.width ?? 0;
    // The dock height changes the stage, but only caption width invalidates text layout.
    if (width === captionWidth) return;
    captionWidth = width;
    scheduleCaptionMeasurement();
  });
  captionResize.observe(caption);
  let footerHeight = 0;
  const footerResize = new ResizeObserver(entries => {
    const height = entries[entries.length - 1]?.borderBoxSize[0]?.blockSize;
    if (height === undefined || height === footerHeight) return;
    footerHeight = height;
    root.style.setProperty('--independence-footer-height', `${height}px`);
  });
  footerResize.observe(footer);
  const captionFontsChanged = () => {
    ++captionFontVersion;
    scheduleCaptionMeasurement();
  };
  void document.fonts.ready.then(() => {
    if (disposed) return;
    captionFontsChanged();
    document.fonts.addEventListener('loadingdone', captionFontsChanged);
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  syncFullscreen();
  preference.addEventListener('change', updateMotion);
  window.addEventListener('hashchange', route);
  window.addEventListener('keydown', keyboard);
  updateMotion();
  void route();
  return () => {
    disposed = true;
    ++routeVersion;
    evidence.close();
    closeDrawer();
    player.destroy();
    pageCleanup();
    resize.disconnect();
    if (fitFrame) cancelAnimationFrame(fitFrame);
    captionResize.disconnect();
    footerResize.disconnect();
    if (captionFrame) cancelAnimationFrame(captionFrame);
    document.fonts.removeEventListener('loadingdone', captionFontsChanged);
    root.style.removeProperty('--independence-footer-height');
    document.removeEventListener('fullscreenchange', syncFullscreen);
    main.removeEventListener('focusin', ensureVisible);
    preference.removeEventListener('change', updateMotion);
    window.removeEventListener('hashchange', route);
    window.removeEventListener('keydown', keyboard);
    window.removeEventListener('pointerup', endScrub);
    window.removeEventListener('pointercancel', endScrub);
    root.classList.remove('theater-app', 'is-reader');
    root.replaceChildren();
  };
}
