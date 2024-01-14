<?php

/**
 * Class for importing records from a csv file.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at https://mozilla.org/MPL/2.0/.
 *
 * @package   phpMyFAQ
 * @author    Jan Harms <model_railroader@gmx-topmail.de>
 * @copyright 2024 phpMyFAQ Team
 * @license   https://www.mozilla.org/MPL/2.0/ Mozilla Public License Version 2.0
 * @link      https://www.phpmyfaq.de
 * @since     2024-01-05
 */

namespace phpMyFAQ\Faq;

use phpMyFAQ\Core\Exception;
use phpMyFAQ\Language;
use phpMyFAQ\Faq;
use phpMyFAQ\Category;
use phpMyFAQ\Configuration;
use phpMyFAQ\Entity\FaqEntity;
use phpMyFAQ\User\CurrentUser;
use phpMyFAQ\Filter;

/**
 * Class FaqImport
 *
 * @package phpMyFAQ\Faq
 */

readonly class FaqImport
{
    public function __construct(private Configuration $config)
    {
    }

    /**
     * Imports a record with the given record data.
     *
     * @param array $record Record data
     * @return bool
     * @throws Exception
     */
    public function import(array $record): bool
    {
        $language = new Language($this->config);
        $currentLanguage = $language->setLanguageByAcceptLanguage();

        $user = CurrentUser::getCurrentUser($this->config);
        [$currentUser, $currentGroups] = CurrentUser::getCurrentUserGroupId($user);

        $faq = new Faq($this->config);
        $faq->setUser($currentUser);
        $faq->setGroups($currentGroups);

        $category = new Category($this->config, $currentGroups, true);
        $category->setUser($currentUser);
        $category->setGroups($currentGroups);
        $category->setLanguage($currentLanguage);

        $categoryId = Filter::filterVar($record[0], FILTER_VALIDATE_INT);
        $question = Filter::filterVar($record[1], FILTER_SANITIZE_SPECIAL_CHARS);
        $answer = Filter::filterVar($record[2], FILTER_SANITIZE_SPECIAL_CHARS);
        $keywords = Filter::filterVar($record[3], FILTER_SANITIZE_SPECIAL_CHARS);
        $languageCode = Filter::filterVar($record[4], FILTER_SANITIZE_SPECIAL_CHARS);
        $author = Filter::filterVar($record[5], FILTER_SANITIZE_SPECIAL_CHARS);
        $email = Filter::filterVar($record[6], FILTER_SANITIZE_EMAIL);
        $isActive = Filter::filterVar($record[7], FILTER_VALIDATE_BOOLEAN);
        $isSticky = Filter::filterVar($record[8], FILTER_VALIDATE_BOOLEAN);

        if ($faq->hasTitleAHash($question)) {
            throw new Exception('It is not allowed, that the question title ' . $question . ' contains a hash.');
        }

        $categories = [$categoryId];
        $isActive = !is_null($isActive);
        $isSticky = !is_null($isSticky);

        $faqData = new FaqEntity();
        $faqData
                ->setLanguage($languageCode)
                ->setQuestion($question)
                ->setAnswer($answer)
                ->setKeywords($keywords)
                ->setAuthor($author)
                ->setEmail($email)
                ->setActive($isActive)
                ->setSticky($isSticky)
                ->setComment(false)
                ->setNotes('');

        $faqId = $faq->create($faqData);

        $faqMetaData = new FaqMetaData($this->config);
        $faqMetaData->setFaqId($faqId)->setFaqLanguage($languageCode)->setCategories($categories)->save();

        return true;
    }

    /**
     * Returns the data from a csv file.
     *
     * @param resource $handle
     *
     * @return array $csvData
     */
    public function parseCSV($handle): array
    {
        while (($record = fgetcsv($handle)) !== false) {
            $csvData[] = $record;
        }
        return $csvData;
    }

    /**
     * Returns true if given Symfony FileBag-object is a csv file. Returns false if not.
     *
     * @param FileBag $file
     *
     * @return bool
     */
    public function isCSVFile($file): bool
    {
        $allowedExtensions = ['csv'];
        $fileExtension = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION);

        return in_array(strtolower($fileExtension), $allowedExtensions);
    }

    /**
     * Checks if the given csv-Data matches all requirements.
     *
     * @param array $csvData
     *
     * @return bool
     */
    public function validateCSV(array $csvData): bool
    {
        foreach ($csvData as $row) {
            if (count($row) !== 9) {
                return false;
            }

            $requiredColumns = [0, 1, 2, 4, 5, 6, 7, 8];
            foreach ($requiredColumns as $columnIndex) {
                if (empty($row[$columnIndex])) {
                    return false;
                }
            }

            $activatedColumn = 7;
            $importantFAQColumn = 8;
            $validBooleanValues = ['true', 'false'];

            if (
                !in_array(strtolower($row[$activatedColumn]), $validBooleanValues) ||
                    !in_array(strtolower($row[$importantFAQColumn]), $validBooleanValues)
            ) {
                return false;
            }
        }

        return true;
    }
}
