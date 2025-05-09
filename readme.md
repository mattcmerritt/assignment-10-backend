# How to run

1. Create `data-store` directory in root directory.
2. Create two JSON files called `items.json` and `users.json`.
3. Populate `users.json` with at least one user in the following format:
```json
[
    {
        "id": 1,
        "username": "<USERNAME>",
        "passwordHash": "<SHA256 PASSWORD HASH>"
    }
]
```
4. Populate `items.json` with an empty array:
```json
[

]
```
5. Create the `.env` environment file with a key as shown in the sample.
6. Run the following commands:
```bash
npm install
```
7. Run the following command to start the backend server (port 3000 must be open):
```bash
npm run start
```