## NAME

#### Run
> node index.js

#### Run from CLI
```
curl --location --request POST 'localhost:8081' \
--header 'Content-Type: application/json' \
--data-raw '{
    "organization": "google",
    "n": 5,
    "m": 3
}'
```