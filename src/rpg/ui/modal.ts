export interface UiAction {
  label: string;
  run: () => void;
  sub?: string;
  kind?: string;
  art?: string;
  disabled?: boolean;
}

export function appendActionButton(parent: HTMLElement, action: UiAction, beforeRun?: () => void) {
  const button=document.createElement('button');
  button.className='rpg-action';
  button.innerHTML=`<span>${action.label}</span>${action.sub?`<small>${action.sub}</small>`:''}`;
  button.onclick=()=>{beforeRun?.();action.run();};
  parent.append(button);
  return button;
}

export function mountModalFrame(overlay: HTMLElement, title: string, body: string, extra='') {
  overlay.innerHTML=`<div class="modal-shade"><section class="rpg-panel modal-frame"><span class="panel-kicker">POCKET GROVE</span><h2>${title}</h2>${extra}<p>${body.replaceAll('\n','<br>')}</p><div class="panel-actions"></div></section></div>`;
  return overlay.querySelector<HTMLElement>('.panel-actions')!;
}

export function convertToCompactClose(button: HTMLButtonElement) {
  const panel=button.closest<HTMLElement>('.rpg-panel')!,footer=button.parentElement!;
  button.className='panel-close';button.setAttribute('aria-label','关闭面板');button.title='关闭 · Esc';
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
  panel.prepend(button);panel.classList.add('has-close');if(!footer.children.length)footer.remove();
}
