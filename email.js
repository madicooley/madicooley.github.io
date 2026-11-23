// Builds the email link in the browser so the address isn't sitting in the HTML for scrapers.
// Without JavaScript, the obfuscated address in the markup still shows.
const emailUser = 'mcooley220';
const emailDomain = 'gmail.com';
const emailAddress = `${emailUser}@${emailDomain}`;

for (const menu of document.querySelectorAll('.email-disclosure')) {
  const panel = document.createElement('div');
  panel.className = 'email-menu';

  const address = document.createElement('p');
  address.textContent = emailAddress;

  const actions = document.createElement('div');
  actions.className = 'email-actions';

  const send = document.createElement('a');
  send.className = 'button';
  send.href = `mailto:${emailAddress}`;
  send.textContent = 'Send email';

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Copy address';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = 'Copy failed';
    }
    setTimeout(() => { copy.textContent = 'Copy address'; }, 2000);
  });

  actions.append(send, copy);
  panel.append(address, actions);
  menu.querySelector('p')?.replaceWith(panel);
}
