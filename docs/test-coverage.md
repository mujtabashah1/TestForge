# Implemented test coverage

| Area           | API                                                                                     | UI                                             | Database / integration                   |
| -------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Authentication | Register, login, duplicate, validation, bad token                                       | Valid login, invalid password, protected route | User persistence                         |
| Products       | Create, edit inventory, archive, authorization, invalid price, search, pagination, sort | Search and empty result                        | Initial/final inventory                  |
| Cart           | Get, quantity update, insufficient stock, remove                                        | Add, view, checkout                            | Cart consumed transactionally            |
| Orders         | Schema, duplicate checkout, cross-user key isolation, invalid transition                | Confirmation/history                           | Order, line items, cancellation restock  |
| Payments       | Success, decline, retry, duplicate retry                                                | Success/decline controls                       | Payment/order agreement and refund       |
| Concurrency    | Parallel checkout                                                                       | —                                              | Stock/winner count, single restock claim |
| Responsive     | —                                                                                       | Mobile Chromium catalog                        | —                                        |

Useful future coverage includes clock-controlled expiry tests, full admin transition UI coverage, automated accessibility scanning, and load profiles.
