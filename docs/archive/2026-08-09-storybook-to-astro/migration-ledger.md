# 디자인 시스템 문서 이전 원장

- 기준일: 2026-08-09
- module: 39개
- 실행 예제: 154개
- browser 검증 module: 35개
- interaction 계약: 9개
- 서술 문서: 2개

이 원장은 삭제 직전의 실행 명세와 Astro 목적지를 일대일로 연결한다.

## Module

| Module                                   | 실행 예제 | 이전 계약               |
| ---------------------------------------- | --------: | ----------------------- |
| `Patterns/Admin`                         |         2 | browser                 |
| `Components/Lesson/AiFeedbackAnswer`     |         7 | browser, args, argTypes |
| `Components/Lesson/CategorizeAnswer`     |         4 | browser, args, argTypes |
| `Components/Lesson/CompareStepView`      |         2 | browser, args, argTypes |
| `Components/Lesson/FillBlankAnswer`      |         3 | browser, args, argTypes |
| `Components/Lesson/MatchAnswer`          |         5 | browser, args, argTypes |
| `Components/Lesson/MultipleChoiceAnswer` |         3 | browser, args, argTypes |
| `Components/Lesson/OrderAnswer`          |         4 | browser, args, argTypes |
| `Components/Lesson/ReadingStepView`      |         3 | browser, args, argTypes |
| `Components/Lesson/SelectAnswer`         |         4 | browser, args, argTypes |
| `Components/Lesson/WriteAnswer`          |         3 | browser, args, argTypes |
| `Components/UI/Accordion`                |         5 | browser                 |
| `Components/UI/AlertDialog`              |         5 | browser                 |
| `Components/UI/Alert`                    |         3 | browser                 |
| `Components/UI/Badge`                    |         5 | browser, args, argTypes |
| `Components/UI/Button`                   |        10 | browser, args, argTypes |
| `Components/UI/Card`                     |         6 | browser                 |
| `Components/UI/Dialog`                   |         1 | browser                 |
| `Components/UI/DropdownMenu`             |         6 | browser                 |
| `Components/UI/Empty`                    |         4 | browser                 |
| `Components/UI/Field`                    |         5 | browser                 |
| `Components/UI/Input`                    |         9 | browser, args           |
| `Components/UI/Label`                    |         4 | browser, args           |
| `Components/UI/Lesson`                   |         2 | browser                 |
| `Components/UI/Popover`                  |         1 | browser                 |
| `Components/UI/Progress`                 |         8 | browser, args           |
| `Components/UI/Select`                   |         8 | browser                 |
| `Components/UI/Separator`                |         4 | browser, args, argTypes |
| `Components/UI/Status`                   |         1 | browser                 |
| `Components/UI/Table`                    |         2 | browser                 |
| `Components/UI/Tabs`                     |         4 | browser                 |
| `Components/UI/Textarea`                 |         8 | browser, args           |
| `Components/UI/ThemeSelector`            |         3 | browser, args, argTypes |
| `Foundations/Color`                      |         3 | browser                 |
| `Foundations/Motion`                     |         1 | render                  |
| `Foundations/Spacing`                    |         1 | render                  |
| `Foundations/Typography`                 |         2 | render                  |
| `Quality/Checklist`                      |         1 | render                  |
| `Recipes/Course Management`              |         2 | browser                 |

## 실행 예제

| 이전 ID                                                      | Astro 목적지                                                            | 검증        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------- |
| `patterns-admin--overview`                                   | `/docs/patterns/admin#story-overview`                                   | browser     |
| `patterns-admin--empty-result`                               | `/docs/patterns/admin#story-empty-result`                               | browser     |
| `components-lesson-ai-feedback-answer--playground`           | `/docs/extensions/lesson/ai-feedback-answer#story-playground`           | browser     |
| `components-lesson-ai-feedback-answer--empty-draft`          | `/docs/extensions/lesson/ai-feedback-answer#story-empty-draft`          | browser     |
| `components-lesson-ai-feedback-answer--no-retry`             | `/docs/extensions/lesson/ai-feedback-answer#story-no-retry`             | browser     |
| `components-lesson-ai-feedback-answer--with-feedback`        | `/docs/extensions/lesson/ai-feedback-answer#story-with-feedback`        | browser     |
| `components-lesson-ai-feedback-answer--request-error`        | `/docs/extensions/lesson/ai-feedback-answer#story-request-error`        | browser     |
| `components-lesson-ai-feedback-answer--daily-quota`          | `/docs/extensions/lesson/ai-feedback-answer#story-daily-quota`          | browser     |
| `components-lesson-ai-feedback-answer--attempt-limit`        | `/docs/extensions/lesson/ai-feedback-answer#story-attempt-limit`        | browser     |
| `components-lesson-categorize-answer--playground`            | `/docs/extensions/lesson/categorize-answer#story-playground`            | browser     |
| `components-lesson-categorize-answer--checked-correct`       | `/docs/extensions/lesson/categorize-answer#story-checked-correct`       | browser     |
| `components-lesson-categorize-answer--checked-wrong`         | `/docs/extensions/lesson/categorize-answer#story-checked-wrong`         | browser     |
| `components-lesson-categorize-answer--narrow-with-long-tags` | `/docs/extensions/lesson/categorize-answer#story-narrow-with-long-tags` | browser     |
| `components-lesson-compare-step-view--playground`            | `/docs/extensions/lesson/compare-step-view#story-playground`            | browser     |
| `components-lesson-compare-step-view--three-versions`        | `/docs/extensions/lesson/compare-step-view#story-three-versions`        | browser     |
| `components-lesson-fill-blank-answer--playground`            | `/docs/extensions/lesson/fill-blank-answer#story-playground`            | browser     |
| `components-lesson-fill-blank-answer--checked-correct`       | `/docs/extensions/lesson/fill-blank-answer#story-checked-correct`       | browser     |
| `components-lesson-fill-blank-answer--checked-wrong`         | `/docs/extensions/lesson/fill-blank-answer#story-checked-wrong`         | browser     |
| `components-lesson-match-answer--playground`                 | `/docs/extensions/lesson/match-answer#story-playground`                 | browser     |
| `components-lesson-match-answer--pending-choice`             | `/docs/extensions/lesson/match-answer#story-pending-choice`             | browser     |
| `components-lesson-match-answer--connected`                  | `/docs/extensions/lesson/match-answer#story-connected`                  | browser     |
| `components-lesson-match-answer--checked-correct`            | `/docs/extensions/lesson/match-answer#story-checked-correct`            | browser     |
| `components-lesson-match-answer--checked-wrong`              | `/docs/extensions/lesson/match-answer#story-checked-wrong`              | browser     |
| `components-lesson-multiple-choice-answer--playground`       | `/docs/extensions/lesson/multiple-choice-answer#story-playground`       | browser     |
| `components-lesson-multiple-choice-answer--checked-correct`  | `/docs/extensions/lesson/multiple-choice-answer#story-checked-correct`  | browser     |
| `components-lesson-multiple-choice-answer--checked-wrong`    | `/docs/extensions/lesson/multiple-choice-answer#story-checked-wrong`    | browser     |
| `components-lesson-order-answer--playground`                 | `/docs/extensions/lesson/order-answer#story-playground`                 | browser     |
| `components-lesson-order-answer--without-numbers`            | `/docs/extensions/lesson/order-answer#story-without-numbers`            | browser     |
| `components-lesson-order-answer--checked-correct`            | `/docs/extensions/lesson/order-answer#story-checked-correct`            | browser     |
| `components-lesson-order-answer--checked-wrong`              | `/docs/extensions/lesson/order-answer#story-checked-wrong`              | browser     |
| `components-lesson-reading-step-view--playground`            | `/docs/extensions/lesson/reading-step-view#story-playground`            | browser     |
| `components-lesson-reading-step-view--without-source`        | `/docs/extensions/lesson/reading-step-view#story-without-source`        | browser     |
| `components-lesson-reading-step-view--long-body`             | `/docs/extensions/lesson/reading-step-view#story-long-body`             | browser     |
| `components-lesson-select-answer--playground`                | `/docs/extensions/lesson/select-answer#story-playground`                | browser     |
| `components-lesson-select-answer--block-layout`              | `/docs/extensions/lesson/select-answer#story-block-layout`              | browser     |
| `components-lesson-select-answer--checked-correct`           | `/docs/extensions/lesson/select-answer#story-checked-correct`           | browser     |
| `components-lesson-select-answer--checked-wrong`             | `/docs/extensions/lesson/select-answer#story-checked-wrong`             | browser     |
| `components-lesson-write-answer--playground`                 | `/docs/extensions/lesson/write-answer#story-playground`                 | browser     |
| `components-lesson-write-answer--with-claim`                 | `/docs/extensions/lesson/write-answer#story-with-claim`                 | browser     |
| `components-lesson-write-answer--checked-with-sample`        | `/docs/extensions/lesson/write-answer#story-checked-with-sample`        | browser     |
| `components-ui-accordion--single`                            | `/docs/components/accordion#story-single`                               | browser     |
| `components-ui-accordion--multiple`                          | `/docs/components/accordion#story-multiple`                             | browser     |
| `components-ui-accordion--with-disabled-item`                | `/docs/components/accordion#story-with-disabled-item`                   | browser     |
| `components-ui-accordion--custom-layout`                     | `/docs/components/accordion#story-custom-layout`                        | browser     |
| `components-ui-accordion--interaction`                       | `/docs/components/accordion#story-interaction`                          | interaction |
| `components-ui-alert-dialog--default`                        | `/docs/components/alert-dialog#story-default`                           | browser     |
| `components-ui-alert-dialog--with-media`                     | `/docs/components/alert-dialog#story-with-media`                        | browser     |
| `components-ui-alert-dialog--small-size`                     | `/docs/components/alert-dialog#story-small-size`                        | browser     |
| `components-ui-alert-dialog--lesson-exit`                    | `/docs/components/alert-dialog#story-lesson-exit`                       | browser     |
| `components-ui-alert-dialog--form-interaction`               | `/docs/components/alert-dialog#story-form-interaction`                  | interaction |
| `components-ui-alert--with-action`                           | `/docs/components/alert#story-with-action`                              | browser     |
| `components-ui-alert--variants`                              | `/docs/components/alert#story-variants`                                 | browser     |
| `components-ui-alert--simple`                                | `/docs/components/alert#story-simple`                                   | browser     |
| `components-ui-badge--playground`                            | `/docs/components/badge#story-playground`                               | browser     |
| `components-ui-badge--variants`                              | `/docs/components/badge#story-variants`                                 | browser     |
| `components-ui-badge--semantic-states`                       | `/docs/components/badge#story-semantic-states`                          | browser     |
| `components-ui-badge--with-icon`                             | `/docs/components/badge#story-with-icon`                                | browser     |
| `components-ui-badge--as-link`                               | `/docs/components/badge#story-as-link`                                  | browser     |
| `components-ui-button--playground`                           | `/docs/components/button#story-playground`                              | browser     |
| `components-ui-button--variants`                             | `/docs/components/button#story-variants`                                | browser     |
| `components-ui-button--sizes`                                | `/docs/components/button#story-sizes`                                   | browser     |
| `components-ui-button--icon-only`                            | `/docs/components/button#story-icon-only`                               | browser     |
| `components-ui-button--with-icon`                            | `/docs/components/button#story-with-icon`                               | browser     |
| `components-ui-button--loading`                              | `/docs/components/button#story-loading`                                 | browser     |
| `components-ui-button--as-child`                             | `/docs/components/button#story-as-child`                                | browser     |
| `components-ui-button--variant-reuse`                        | `/docs/components/button#story-variant-reuse`                           | browser     |
| `components-ui-button--states`                               | `/docs/components/button#story-states`                                  | browser     |
| `components-ui-button--interaction`                          | `/docs/components/button#story-interaction`                             | browser     |
| `components-ui-card--anatomy`                                | `/docs/components/card#story-anatomy`                                   | browser     |
| `components-ui-card--sizes`                                  | `/docs/components/card#story-sizes`                                     | browser     |
| `components-ui-card--variants`                               | `/docs/components/card#story-variants`                                  | browser     |
| `components-ui-card--media-and-actions`                      | `/docs/components/card#story-media-and-actions`                         | browser     |
| `components-ui-card--long-content`                           | `/docs/components/card#story-long-content`                              | browser     |
| `components-ui-card--heading-semantics`                      | `/docs/components/card#story-heading-semantics`                         | browser     |
| `components-ui-dialog--default`                              | `/docs/components/dialog#story-default`                                 | interaction |
| `components-ui-dropdown-menu--default`                       | `/docs/components/dropdown-menu#story-default`                          | browser     |
| `components-ui-dropdown-menu--checkboxes`                    | `/docs/components/dropdown-menu#story-checkboxes`                       | browser     |
| `components-ui-dropdown-menu--radio-group`                   | `/docs/components/dropdown-menu#story-radio-group`                      | browser     |
| `components-ui-dropdown-menu--submenu`                       | `/docs/components/dropdown-menu#story-submenu`                          | browser     |
| `components-ui-dropdown-menu--complex-overlay`               | `/docs/components/dropdown-menu#story-complex-overlay`                  | browser     |
| `components-ui-dropdown-menu--form-interaction`              | `/docs/components/dropdown-menu#story-form-interaction`                 | interaction |
| `components-ui-empty--anatomy`                               | `/docs/components/empty#story-anatomy`                                  | browser     |
| `components-ui-empty--with-media`                            | `/docs/components/empty#story-with-media`                               | browser     |
| `components-ui-empty--framed-sheets`                         | `/docs/components/empty#story-framed-sheets`                            | browser     |
| `components-ui-empty--title-only`                            | `/docs/components/empty#story-title-only`                               | browser     |
| `components-ui-field--anatomy`                               | `/docs/components/field#story-anatomy`                                  | browser     |
| `components-ui-field--states`                                | `/docs/components/field#story-states`                                   | browser     |
| `components-ui-field--groups`                                | `/docs/components/field#story-groups`                                   | browser     |
| `components-ui-field--long-content`                          | `/docs/components/field#story-long-content`                             | browser     |
| `components-ui-field--accessibility`                         | `/docs/components/field#story-accessibility`                            | interaction |
| `components-ui-input--playground`                            | `/docs/components/input#story-playground`                               | browser     |
| `components-ui-input--types-and-sizes`                       | `/docs/components/input#story-types-and-sizes`                          | browser     |
| `components-ui-input--states`                                | `/docs/components/input#story-states`                                   | browser     |
| `components-ui-input--file`                                  | `/docs/components/input#story-file`                                     | browser     |
| `components-ui-input--with-label`                            | `/docs/components/input#story-with-label`                               | browser     |
| `components-ui-input--with-button`                           | `/docs/components/input#story-with-button`                              | browser     |
| `components-ui-input--with-text`                             | `/docs/components/input#story-with-text`                                | browser     |
| `components-ui-input--long-content`                          | `/docs/components/input#story-long-content`                             | browser     |
| `components-ui-input--form-interaction`                      | `/docs/components/input#story-form-interaction`                         | browser     |
| `components-ui-label--playground`                            | `/docs/components/label#story-playground`                               | browser     |
| `components-ui-label--with-input`                            | `/docs/components/label#story-with-input`                               | browser     |
| `components-ui-label--required-field`                        | `/docs/components/label#story-required-field`                           | browser     |
| `components-ui-label--disabled-state`                        | `/docs/components/label#story-disabled-state`                           | browser     |
| `components-ui-lesson--in-progress`                          | `/docs/components/lesson#story-in-progress`                             | browser     |
| `components-ui-lesson--complete`                             | `/docs/components/lesson#story-complete`                                | browser     |
| `components-ui-popover--default`                             | `/docs/components/popover#story-default`                                | interaction |
| `components-ui-progress--playground`                         | `/docs/components/progress#story-playground`                            | browser     |
| `components-ui-progress--variants-and-sizes`                 | `/docs/components/progress#story-variants-and-sizes`                    | browser     |
| `components-ui-progress--empty-track-on-surface`             | `/docs/components/progress#story-empty-track-on-surface`                | browser     |
| `components-ui-progress--boundary-states`                    | `/docs/components/progress#story-boundary-states`                       | browser     |
| `components-ui-progress--labels-and-long-content`            | `/docs/components/progress#story-labels-and-long-content`               | browser     |
| `components-ui-progress--indeterminate`                      | `/docs/components/progress#story-indeterminate`                         | browser     |
| `components-ui-progress--interactive`                        | `/docs/components/progress#story-interactive`                           | browser     |
| `components-ui-progress--accessibility`                      | `/docs/components/progress#story-accessibility`                         | interaction |
| `components-ui-select--playground`                           | `/docs/components/select#story-playground`                              | browser     |
| `components-ui-select--options-and-groups`                   | `/docs/components/select#story-options-and-groups`                      | browser     |
| `components-ui-select--states`                               | `/docs/components/select#story-states`                                  | browser     |
| `components-ui-select--long-content`                         | `/docs/components/select#story-long-content`                            | browser     |
| `components-ui-select--form-interaction`                     | `/docs/components/select#story-form-interaction`                        | interaction |
| `components-ui-select--scrollable`                           | `/docs/components/select#story-scrollable`                              | browser     |
| `components-ui-select--disabled-items`                       | `/docs/components/select#story-disabled-items`                          | browser     |
| `components-ui-select--sizes`                                | `/docs/components/select#story-sizes`                                   | browser     |
| `components-ui-separator--playground`                        | `/docs/components/separator#story-playground`                           | browser     |
| `components-ui-separator--horizontal`                        | `/docs/components/separator#story-horizontal`                           | browser     |
| `components-ui-separator--vertical`                          | `/docs/components/separator#story-vertical`                             | browser     |
| `components-ui-separator--custom-style`                      | `/docs/components/separator#story-custom-style`                         | browser     |
| `components-ui-status--loading-states`                       | `/docs/components/spinner#story-loading-states`                         | browser     |
| `components-ui-table--default`                               | `/docs/components/table#story-default`                                  | browser     |
| `components-ui-table--striped`                               | `/docs/components/table#story-striped`                                  | browser     |
| `components-ui-tabs--default`                                | `/docs/components/tabs#story-default`                                   | browser     |
| `components-ui-tabs--line`                                   | `/docs/components/tabs#story-line`                                      | browser     |
| `components-ui-tabs--vertical`                               | `/docs/components/tabs#story-vertical`                                  | browser     |
| `components-ui-tabs--keyboard-interaction`                   | `/docs/components/tabs#story-keyboard-interaction`                      | interaction |
| `components-ui-textarea--playground`                         | `/docs/components/textarea#story-playground`                            | browser     |
| `components-ui-textarea--sizes-and-resize`                   | `/docs/components/textarea#story-sizes-and-resize`                      | browser     |
| `components-ui-textarea--states`                             | `/docs/components/textarea#story-states`                                | browser     |
| `components-ui-textarea--with-label`                         | `/docs/components/textarea#story-with-label`                            | browser     |
| `components-ui-textarea--with-text`                          | `/docs/components/textarea#story-with-text`                             | browser     |
| `components-ui-textarea--with-button`                        | `/docs/components/textarea#story-with-button`                           | browser     |
| `components-ui-textarea--counter-composition`                | `/docs/components/textarea#story-counter-composition`                   | browser     |
| `components-ui-textarea--form-interaction`                   | `/docs/components/textarea#story-form-interaction`                      | browser     |
| `components-ui-theme-selector--playground`                   | `/docs/extensions/theme-selector#story-playground`                      | browser     |
| `components-ui-theme-selector--selected-states`              | `/docs/extensions/theme-selector#story-selected-states`                 | browser     |
| `components-ui-theme-selector--disabled`                     | `/docs/extensions/theme-selector#story-disabled`                        | browser     |
| `foundations-color--overview`                                | `/docs/foundations/color#story-overview`                                | browser     |
| `foundations-color--semantic-tokens`                         | `/docs/foundations/color#story-semantic-tokens`                         | browser     |
| `foundations-color--contrast-pairs`                          | `/docs/foundations/color#story-contrast-pairs`                          | browser     |
| `foundations-motion--motion-preference`                      | `/docs/foundations/motion#story-motion-preference`                      | render      |
| `foundations-spacing--scale`                                 | `/docs/foundations/spacing#story-scale`                                 | render      |
| `foundations-typography--scale`                              | `/docs/foundations/typography#story-scale`                              | render      |
| `foundations-typography--long-content`                       | `/docs/foundations/typography#story-long-content`                       | render      |
| `quality-checklist--content-contracts`                       | `/docs/quality/content#story-content-contracts`                         | render      |
| `recipes-course-management--card-recipe`                     | `/docs/recipes/course-management#story-card-recipe`                     | browser     |
| `recipes-course-management--responsive-form`                 | `/docs/recipes/course-management#story-responsive-form`                 | browser     |

## 서술 문서

| 이전 ID                           | Astro 목적지                  |
| --------------------------------- | ----------------------------- |
| `getting-started-welcome`         | `/docs/getting-started`       |
| `quality-accessibility-checklist` | `/docs/quality/accessibility` |
