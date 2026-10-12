/* No clock, tween or runtime state: the existing paused GSAP timeline owns this. */
window.FitnodeNotification = function ({parent,id='fitnode-notification'}) {
  const node=document.createElement('div');
  node.id=id;
  node.className='fitnode-notification';
  node.setAttribute('role','img');
  node.setAttribute('aria-label','Fitnode: Tu coach actualizó tu rutina');
  node.innerHTML='<img class="fitnode-notification__icon" src="assets/ui/notification/fitnode-fn-light.png" alt=""><div class="fitnode-notification__content"><div class="fitnode-notification__heading"><span>Fitnode</span><span class="fitnode-notification__time">ahora</span></div><div class="fitnode-notification__message">Tu coach actualizó tu rutina</div></div>';
  parent.appendChild(node);
  return node;
};
