# WannaBet Manual/UAT Test Cases

| Test Case ID | Feature      | Preconditions          | Steps                                 | Expected Result                  | Actual Result | Pass/Fail |
| ------------ | ------------ | ---------------------- | ------------------------------------- | -------------------------------- | ------------- | --------- |
| TC-001       | Register     | App running            | Fill register form, submit            | User account created, redirected |               |           |
| TC-002       | Login        | User exists            | Fill login form, submit               | User logged in, dashboard shown  |               |           |
| TC-003       | Create Match | User logged in         | Go to create match, fill form, submit | Match appears in lobby           |               |           |
| TC-004       | Deposit      | User logged in         | Go to wallet, deposit funds           | Wallet balance increases         |               |           |
| TC-005       | Dispute      | Match in dispute state | Submit evidence, moderator resolves   | Dispute resolved, payout correct |               |           |
