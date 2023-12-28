/**
 * Handle data for FAQs overview management
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @package   phpMyFAQ
 * @author    Thorsten Rinne <thorsten@phpmyfaq.de>
 * @copyright 2023 phpMyFAQ Team
 * @license   http://www.mozilla.org/MPL/2.0/ Mozilla Public License Version 2.0
 * @link      https://www.phpmyfaq.de
 * @since     2023-02-26
 */

import { deleteFaq, fetchAllFaqsByCategory } from '../api';
import { addElement } from '../../../../assets/src/utils';

export const handleFaqOverview = async () => {
  const collapsedCategories = document.querySelectorAll('.accordion-collapse');

  if (collapsedCategories) {
    collapsedCategories.forEach((category) => {
      const categoryId = category.getAttribute('data-pmf-categoryId');
      category.addEventListener('hidden.bs.collapse', () => {
        clearCategoryTable(categoryId);
      });
      category.addEventListener('shown.bs.collapse', async () => {
        const faqs = await fetchAllFaqsByCategory(categoryId);
        await populateCategoryTable(categoryId, faqs.faqs);
        const deleteFaqButtons = document.querySelectorAll('.pmf-button-delete-faq');
        const toggleStickyAllFaqs = document.querySelectorAll('.pmf-admin-faqs-all-sticky');
        const toggleStickyFaq = document.querySelectorAll('.pmf-admin-sticky-faq');
        const toggleActiveAllFaqs = document.querySelectorAll('.pmf-admin-faqs-all-active');
        const toggleActiveFaq = document.querySelectorAll('.pmf-admin-active-faq');

        deleteFaqButtons.forEach((element) => {
          element.addEventListener('click', async (event) => {
            event.preventDefault();

            const faqId = event.target.getAttribute('data-pmf-id');
            const faqLanguage = event.target.getAttribute('data-pmf-language');
            const token = event.target.getAttribute('data-pmf-token');

            if (confirm('Are you sure?')) {
              try {
                const result = await deleteFaq(faqId, faqLanguage, token);
                if (result.success) {
                  const faqTableRow = document.getElementById(`faq_${faqId}_${faqLanguage}`);
                  faqTableRow.remove();
                }
              } catch (error) {
                console.error(error);
              }
            }
          });
        });

        toggleStickyAllFaqs.forEach((element) => {
          element.addEventListener('change', (event) => {
            event.preventDefault();

            const categoryId = event.target.getAttribute('data-pmf-category-id');
            const faqIds = [];
            const token = event.target.getAttribute('data-pmf-csrf');

            const checkboxes = document.querySelectorAll('input[type=checkbox]');
            if (checkboxes) {
              checkboxes.forEach((checkbox) => {
                if (checkbox.getAttribute('data-pmf-category-id-sticky') === categoryId) {
                  checkbox.checked = element.checked;
                  if (checkbox.checked === true) {
                    faqIds.push(checkbox.getAttribute('data-pmf-faq-id'));
                  }
                }
              });
              saveStatus(categoryId, faqIds, token, event.target.checked, 'sticky');
            }
          });
        });

        toggleStickyFaq.forEach((element) => {
          element.addEventListener('change', (event) => {
            event.preventDefault();

            const categoryId = event.target.getAttribute('data-pmf-category-id-sticky');
            const faqId = event.target.getAttribute('data-pmf-faq-id');
            const token = event.target.getAttribute('data-pmf-csrf');

            saveStatus(categoryId, [faqId], token, event.target.checked, 'sticky');
          });
        });

        toggleActiveAllFaqs.forEach((element) => {
          element.addEventListener('change', (event) => {
            event.preventDefault();

            const categoryId = event.target.getAttribute('data-pmf-category-id');
            const faqIds = [];
            const token = event.target.getAttribute('data-pmf-csrf');

            const checkboxes = document.querySelectorAll('input[type=checkbox]');
            if (checkboxes) {
              checkboxes.forEach((checkbox) => {
                if (checkbox.getAttribute('data-pmf-category-id-active') === categoryId) {
                  checkbox.checked = element.checked;
                  if (checkbox.checked === true) {
                    faqIds.push(checkbox.getAttribute('data-pmf-faq-id'));
                  }
                }
              });
              saveStatus(categoryId, faqIds, token, event.target.checked, 'active');
            }
          });
        });

        toggleActiveFaq.forEach((element) => {
          element.addEventListener('change', (event) => {
            event.preventDefault();

            const categoryId = event.target.getAttribute('data-pmf-category-id-active');
            const faqId = event.target.getAttribute('data-pmf-faq-id');
            const token = event.target.getAttribute('data-pmf-csrf');

            saveStatus(categoryId, [faqId], token, event.target.checked, 'active');
          });
        });
      });
    });
  }
};

const saveStatus = (categoryId, faqIds, token, checked, type) => {
  let url;
  const languageElement = document.getElementById(`${type}_record_${categoryId}_${faqIds[0]}`);
  const faqLanguage = languageElement.getAttribute('lang');

  if ('active' === type) {
    url = './api/faq/activate';
  } else {
    url = './api/faq/sticky';
  }

  fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      csrf: token,
      categoryId: categoryId,
      faqIds: faqIds,
      faqLanguage: faqLanguage,
      checked: checked,
    }),
  })
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok: ', { cause: { response } });
    })
    .then((response) => {
      const result = response;
      if (result.success) {
        console.error(result.success);
      } else {
        console.error(result.error);
      }
    })
    .catch(async (error) => {
      console.error(await error.cause.response.json());
    });
};

const populateCategoryTable = async (catgoryId, faqs) => {
  const tableBody = document.getElementById(`tbody-category-id-${catgoryId}`);
  const csrfToken = tableBody.getAttribute('data-pmf-csrf');

  faqs.forEach((faq) => {
    const row = document.createElement('tr');
    row.setAttribute('id', `faq_${faq.id}_${faq.language}`);

    row.append(
      addElement('td', { classList: 'align-middle text-center' }, [
        addElement('a', {
          classList: 'text-decoration-none',
          href: `?action=editentry&id=${faq.id}&lang=${faq.language}`,
          innerText: faq.id,
        }),
      ])
    );
    row.append(addElement('td', { classList: 'align-middle text-center', innerText: faq.language }));
    row.append(
      addElement('td', { classList: 'align-middle text-center' }, [
        addElement('a', {
          classList: 'text-decoration-none',
          href: `?action=editentry&id=${faq.id}&lang=${faq.language}`,
          innerText: faq.solution_id,
        }),
      ])
    );
    row.append(
      addElement('td', {}, [
        addElement('a', {
          classList: 'text-decoration-none',
          href: `?action=editentry&id=${faq.id}&lang=${faq.language}`,
          innerText: faq.question,
        }),
      ])
    );
    row.append(addElement('td', { classList: 'small', innerText: faq.created }));
    row.append(
      addElement('td', { classList: 'align-middle' }, [
        addElement('input', {
          classList: 'form-check-input pmf-admin-sticky-faq',
          type: 'checkbox',
          'data-pmfCategoryIdSticky': faq.category_id,
          'data-pmfFaqId': faq.id,
          'data-pmfCsrf': csrfToken,
          lang: faq.language,
          id: `sticky_record_${faq.category_id}_${faq.id}`,
          checked: faq.sticky === 'yes' ? 'checked' : '',
        }),
      ])
    );
    row.append(
      addElement('td', { classList: 'align-middle' }, [
        addElement('input', {
          classList: 'form-check-input pmf-admin-active-faq',
          type: 'checkbox',
          'data-pmfCategoryIdActive': faq.category_id,
          'data-pmfFaqId': faq.id,
          'data-pmfCsrf': csrfToken,
          lang: faq.language,
          id: `active_record_${faq.category_id}_${faq.id}`,
          checked: faq.active === 'yes' ? 'checked' : '',
        }),
      ])
    );
    row.append(
      addElement('td', { classList: 'align-middle text-center' }, [
        addElement(
          'a',
          { classList: 'btn btn-info btn-sm', href: `?action=copyentry&id=${faq.id}&lang=${faq.language}` },
          [addElement('i', { classList: 'fa fa-copy', 'aria-hidden': 'true' })]
        ),
      ])
    );
    row.append(
      addElement('td', { classList: 'align-middle text-center' }, [
        addElement('div', { classList: 'checkbox' }, [
          addElement(
            'a',
            {
              classList: 'btn btn-primary btn-sm dropdown-toggle',
              href: '#',
              role: 'button',
              id: 'dropdownAddNewTranslation',
              'data-bsToggle': 'dropdown',
              'aria-haspopup': 'true',
              'aria-expanded': 'false',
            },
            [addElement('i', { classList: 'fa fa-globe', 'aria-hidden': 'true' })]
          ),
          addElement('div', { classList: 'dropdown-menu', 'aria-labelledby': 'dropdownAddNewTranslation' }, [
            addElement('a', { classList: 'dropdown-item', innerText: 'n/a' }),
          ]),
        ]),
      ])
    );
    row.append(
      addElement('td', { classList: 'text-center' }, [
        addElement(
          'button',
          {
            classList: 'btn btn-danger btn-sm pmf-button-delete-faq',
            type: 'button',
            'data-pmfId': faq.id,
            'data-pmfLanguage': faq.language,
            'data-pmfToken': csrfToken,
          },
          [
            addElement('i', {
              classList: 'fa fa-trash',
              'aria-hidden': 'true',
              'data-pmfId': faq.id,
              'data-pmfLanguage': faq.language,
              'data-pmfToken': csrfToken,
            }),
          ]
        ),
      ])
    );

    tableBody.appendChild(row);
  });
};

const clearCategoryTable = (catgoryId) => {
  const tableBody = document.getElementById(`tbody-category-id-${catgoryId}`);
  tableBody.innerHTML = '';
};
