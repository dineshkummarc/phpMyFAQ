/**
 * Upgrade related code.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @package   phpMyFAQ
 * @author    Thorsten Rinne <thorsten@phpmyfaq.de>
 * @author    Jan Harms <model_railroader@gmx-topmail.de>
 * @copyright 2023 phpMyFAQ Team
 * @license   https://www.mozilla.org/MPL/2.0/ Mozilla Public License Version 2.0
 * @link      https://www.phpmyfaq.de
 * @since     2023-07-11
 */

import { addElement } from '../../../../assets/src/utils';
import { fetchHealthCheck } from '../api';

export const handleCheckForUpdates = () => {
  const checkHealthButton = document.getElementById('pmf-button-check-health');
  const checkUpdateButton = document.getElementById('pmf-button-check-updates');
  const downloadButton = document.getElementById('pmf-button-download-now');
  const extractButton = document.getElementById('pmf-button-extract-package');
  const installButton = document.getElementById('pmf-button-install-package');

  // Health Check
  if (checkHealthButton) {
    checkHealthButton.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        const responseData = await fetchHealthCheck();
        const result = document.getElementById('result-check-health');
        const card = document.getElementById('pmf-update-step-health-check');

        if (responseData.success) {
          card.classList.add('text-bg-success');
          result.replaceWith(addElement('p', { innerText: responseData.success }));
        }
        if (responseData.warning) {
          card.classList.add('text-bg-warning');
          result.replaceWith(addElement('p', { innerText: responseData.warning }));
        }
      } catch (error) {
        if (error.cause && error.cause.response) {
          const errorMessage = await error.cause.response.json();
          console.error(errorMessage);
        } else {
          console.error(error.message);
        }
      }
    });
  }

  // Check Update
  if (checkUpdateButton) {
    checkUpdateButton.addEventListener('click', (event) => {
      event.preventDefault();
      fetch(window.location.pathname + 'api/update-check', {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Network response was not ok: ', { cause: { response } });
        })
        .then((response) => {
          const dateLastChecked = document.getElementById('dateLastChecked');
          const versionLastChecked = document.getElementById('versionLastChecked');
          const card = document.getElementById('pmf-update-step-check-versions');

          if (dateLastChecked) {
            const date = new Date(response.dateLastChecked);
            dateLastChecked.innerText = `${date.toLocaleString()}`;
          }

          if (versionLastChecked) {
            versionLastChecked.innerText = response.version;
          }

          const result = document.getElementById('result-check-versions');
          if (result) {
            card.classList.add('text-bg-success');
            if (response.version === 'current') {
              result.replaceWith(addElement('p', { innerText: response.message }));
            } else {
              result.replaceWith(addElement('p', { innerText: response.message }));
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  // Download package
  if (downloadButton) {
    downloadButton.addEventListener('click', (event) => {
      event.preventDefault();

      let version;
      const versionLastChecked = document.getElementById('versionLastChecked');
      const releaseEnvironment = document.getElementById('releaseEnvironment');

      if (releaseEnvironment.innerText.toLowerCase() === 'nightly') {
        version = 'nightly';
      } else {
        version = versionLastChecked;
      }

      fetch(window.location.pathname + `api/download-package/${version}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Network response was not ok: ', { cause: { response } });
        })
        .then((response) => {
          const result = document.getElementById('result-download-nightly');
          const divExtractPackage = document.getElementById('pmf-update-step-extract-package');
          const card = document.getElementById('pmf-update-step-download');

          if (result) {
            card.classList.add('text-bg-success');
            divExtractPackage.classList.remove('d-none');
            if (response.version === 'current') {
              result.replaceWith(addElement('p', { innerText: response.success }));
            } else {
              result.replaceWith(addElement('p', { innerText: response.success }));
            }
          }
        })
        .catch(async (error) => {
          const errorMessage = await error.cause.response.json();
          const result = document.getElementById('result-download-nightly');
          result.replaceWith(addElement('p', { innerText: errorMessage.error }));
        });
    });
  }

  // Extract package
  if (extractButton) {
    extractButton.addEventListener('click', (event) => {
      event.preventDefault();
      fetch(window.location.pathname + 'api/extract-package', {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Network response was not ok: ', { cause: { response } });
        })
        .then((response) => {
          const result = document.getElementById('result-extract-package');
          const divInstallPackage = document.getElementById('pmf-update-step-install-package');
          const card = document.getElementById('pmf-update-step-extract-package');

          if (result) {
            card.classList.add('text-bg-success');
            divInstallPackage.classList.remove('d-none');
            if (response.success === 'ok') {
              result.replaceWith(addElement('p', { innerText: response.message }));
            } else {
              result.replaceWith(addElement('p', { innerText: response.message }));
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  // Install package
  if (installButton) {
    installButton.addEventListener('click', async (event) => {
      event.preventDefault();
      await createTemporaryBackup();
    });
  }
};

const createTemporaryBackup = async () => {
  await fetch(window.location.pathname + 'api/create-temporary-backup', {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      const progressBarBackup = document.getElementById('result-backup-package');
      const reader = response.body.getReader();

      function pump() {
        return reader.read().then(({ done, value }) => {
          const decodedValue = new TextDecoder().decode(value);

          if (done) {
            progressBarBackup.style.width = '100%';
            progressBarBackup.innerText = '100%';
            progressBarBackup.classList.remove('progress-bar-animated');
            return;
          } else {
            progressBarBackup.style.width = JSON.parse(JSON.stringify(decodedValue)).progress;
            progressBarBackup.innerText = JSON.parse(JSON.stringify(decodedValue)).progress;
          }

          return pump();
        });
      }

      return pump();
    })
    .catch((error) => {
      console.error(error);
    });

  await installPackage();
};

const installPackage = async () => {
  await fetch(window.location.pathname + 'api/install-package', {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      const progressBarInstallation = document.getElementById('result-install-package');
      const reader = response.body.getReader();
      const card = document.getElementById('pmf-update-step-install-package');

      function pump() {
        return reader.read().then(({ done, value }) => {
          const decodedValue = new TextDecoder().decode(value);

          if (done) {
            progressBarInstallation.style.width = '100%';
            progressBarInstallation.innerText = '100%';
            progressBarInstallation.classList.remove('progress-bar-animated');
            card.classList.add('text-bg-success');
            return;
          } else {
            progressBarInstallation.style.width = JSON.parse(JSON.stringify(decodedValue)).progress;
            progressBarInstallation.innerText = JSON.parse(JSON.stringify(decodedValue)).progress;
          }

          return pump();
        });
      }

      return pump();
    })
    .catch((error) => {
      console.error(error);
    });
};
