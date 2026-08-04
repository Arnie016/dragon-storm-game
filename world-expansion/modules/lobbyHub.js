/**
 * Pre-flight lobby hub — Story / Practice / Chapter Select nodes.
 * MVP: DOM overlay; returns to hub on win/loss.
 */

export const LOBBY_MODES = Object.freeze({
  story: { id: 'story', label: 'Story', sub: 'Full beacon road · 12 rings before nightfall' },
  practice: { id: 'practice', label: 'Practice', sub: 'Wake Cove rings only — no keeper hunt' },
  chapter: { id: 'chapter', label: 'Chapter Select', sub: 'Jump to a saved chapter checkpoint' }
});

export class LobbyHub {
  constructor(options = {}) {
    this.root = options.rootEl ?? null;
    this.onSelect = options.onSelect ?? (() => {});
    this.onReturn = options.onReturn ?? (() => {});
    this.mode = null;
    this.chapterPick = 0;
    this._bound = false;
  }

  mount() {
    if (!this.root || this._bound) return;
    this._bound = true;
    this.root.querySelectorAll('[data-lobby-mode]').forEach((node) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = node.dataset.lobbyMode;
        if (mode === 'chapter') {
          this._toggleChapterPanel(true);
          return;
        }
        this.select(mode);
      });
    });
    const confirm = this.root.querySelector('[data-lobby-chapter-go]');
    if (confirm) {
      confirm.addEventListener('click', (e) => {
        e.stopPropagation();
        const pick = Number(this.root.querySelector('[data-lobby-chapter-pick]')?.value ?? 0);
        this.chapterPick = pick;
        this.select('chapter', { chapterIndex: pick });
      });
    }
    const back = this.root.querySelector('[data-lobby-chapter-back]');
    if (back) back.addEventListener('click', (e) => { e.stopPropagation(); this._toggleChapterPanel(false); });
  }

  _toggleChapterPanel(show) {
    const panel = this.root?.querySelector('[data-lobby-chapter-panel]');
    if (panel) panel.classList.toggle('on', !!show);
  }

  select(mode, extra = {}) {
    this.mode = mode;
    this.onSelect(mode, extra);
  }

  show() {
    if (this.root) {
      this.root.classList.remove('hide');
      this._toggleChapterPanel(false);
    }
  }

  hide() {
    if (this.root) this.root.classList.add('hide');
  }

  returnToHub(reason = '') {
    this.mode = null;
    this.show();
    this.onReturn(reason);
  }

  snapshot() {
    return { mode: this.mode, chapterPick: this.chapterPick, visible: this.root ? !this.root.classList.contains('hide') : false };
  }
}

export default LobbyHub;
