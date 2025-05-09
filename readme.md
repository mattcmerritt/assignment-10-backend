# How to run

Create `data-store` directory in root directory.
Create two JSON files called `items.json` and `users.json`.

Populate `users.json` with at least one user in the following format:
```json
[
    {
        "id": 1,
        "username": "<USERNAME>",
        "passwordHash": "<SHA256 PASSWORD HASH>"
    }
]
```

Populate `items.json` with an empty array:
```json
[

]
```

Run the following commands.

```bash
npm install
npm run start
```