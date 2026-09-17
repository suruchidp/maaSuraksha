# Patient Education / Resources

## Product behavior
Health Education at `/patient/education` provides All resources, For you and Saved collections. Search and topic filters run on the server with pagination, rather than filtering the first page in the browser. Search is limited to 100 characters and treats regex punctuation as literal text.

Each resource opens with its full text, educational disclaimer and HTTPS source links. Save and Mark as read are explicit, independent actions persisted to MongoDB. Unsaving retains read state. Inactive resources disappear from patient lists, detail endpoints and saved collections. Mutation failures show an error and keep the action available for retry. A unique `(user, content)` index handles concurrent progress updates; request bodies cannot specify another patient.

The admin editor at `/admin/education` lists published and unpublished resources, supports pagination, preserves English/Hindi/Kannada translations, edits source links and validates content before saving. The API validates create and partial updates, category, tags, language and URLs. Unknown update/progress fields are rejected. Admin responses include explicit language maps; patient display fields remain localized text for compatibility. User identity is included in education query-cache keys.

## Starter content
Nine short resources cover pregnancy visits, nutrition, activity, emotional support, birth preparation, postpartum recovery, breastfeeding, newborn checks and urgent warning signs. Titles and bodies are provided in English, Hindi and Kannada. These are authored educational summaries with further-reading links, not copied articles or individualized prescriptions.

Sources:
- [NHS antenatal care](https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-care-and-appointments/)
- [NHS healthy diet](https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/)
- [NHS activity](https://www.nhs.uk/pregnancy/keeping-well/exercise/)
- [NHS mental health](https://www.nhs.uk/pregnancy/mental-health-in-pregnancy-and-after-the-birth/)
- [NHS labour signs](https://www.nhs.uk/pregnancy/labour-and-birth/signs-that-labour-has-begun/)
- [NHS postpartum recovery](https://www.nhs.uk/pregnancy/labour-and-birth/your-body/)
- [NHS early days](https://www.nhs.uk/pregnancy/labour-and-birth/early-days/)
- [CDC maternal warning signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html)

Resources are seeded at backend startup with unique versioned slugs and insert-only content. Restarts do not overwrite admin edits or reactivate unpublished resources. The library currently contains text and reference links; file uploads, video hosting and offline downloads are not implemented.

## Personalization
For you uses the current stage calculated from persisted LMP (weeks 1–42), pregnancy risk flags, and the latest maternal/GDM screening only when completed. Medium/moderate/high/critical screenings enable follow-up resources; pending/unavailable results never invent risk. Resources carry `general`, `trimester_1/2/3` or `risk_followup` tags. Each result explains its relevance. Without a usable pregnancy profile or screening, general resources are shown. Mood journal data is not used. A delivery/postpartum stage is not inferred from an old due date; all resources remain accessible in the general library.

## APIs
- GET `/api/v1/education?lang=en&category=nutrition&search=food&view=all&page=1&limit=12`
- GET `/api/v1/education/:id?lang=hi`
- GET `/api/v1/education/manage` (ADMIN; includes inactive resources)
- POST `/api/v1/education` (ADMIN)
- PATCH `/api/v1/education/:id` (ADMIN)
- PATCH `/api/v1/education/:id/progress` (PATIENT; `{isSaved?: boolean, isRead?: boolean}`)

## Integration verification
API/database tests cover idempotent seeding, search, translations, pagination, admin create/edit/unpublish, preservation across seed replay, concurrent progress writes, patient isolation, personalization and invalid/unauthorized inputs. UI tests cover resource reading and sources, search/views/pagination, saved/read actions, request failures, admin translation preservation and pre-submit multilingual validation.

A live localhost walkthrough used the existing Synthetic Alerts QA patient: browse nine resources -> save -> open full text and CDC link -> mark read -> Saved collection -> reload -> verify both states persist -> display the saved resource in Hindi and Kannada. English was restored afterward. Admin editing is verified through UI tests and the API/database integration tests.

The existing ML-honesty tests now explicitly simulate an unavailable-model HTTP response. They previously depended on the live ML service being unavailable and failed when trained models returned real completed results. Production ML behavior is unchanged.
