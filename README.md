# VK Watcher [Back End]
Back end web application for collecting data.

## Features:
  - Watches your friends online activity
  - Creates sessions and saves them to the database
  - Serves your static frontend at *./public/*
  - The data can be further analyzed in [VKWatcher-Frontend](https://github.com/Azarattum/VKWatcher-Frontend)
### Usage:
1) Put your [VK API Token](https://vk.com/dev/authcode_flow_user) into .env file. You may use example.env as a reference. You need "friends" and "offline" permissions for your application.

2) Run the application:

	**Option 1**: Using ts-node

    1) Start ts-node with *./src/index.ts* file as entry point:
    ```sh
    ts-node ./src/index.ts
    ```
	Or run vscode's "Launch Program" configuration.

	**Option 2**: Using node
    1) Make sure that all sources was compiled using webpack into *./dist/bundle.js* (look **release** npm script).
    2) Start the script using regular node:
    ```sh
    node ./dist/bundle.js
    ```
3) Additionaly, you can create *./public* folder and put there your fontend part to be served.

### Installation:
Install all dependencies:
```sh
npm install
```

### NPM Scripts:
| Script      | Description                                |
| ----------- | ------------------------------------------ |
| **release** | Creates a production build of the project  |
| build       | Creates a development build of the project |

### Utils Scripts:
  - **Converter**: converts old JSON session format to a new database

    Run:
    ```sh
    ts-node ./src/utils/converter.ts <path_to_sessions.json_file>
    ```
