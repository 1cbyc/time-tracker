<p align="center">
  <img src="./assets/icons/512x512.png" />
</p>

# 🕘 TimeTracker
Track time, add notes, view reports of your time, and more.

Start and stop time, jump between tasks, and add details on how time was spent.

### Features:

- create projects (choose project color)
- create tasks with subtasks (drag&drop supported)
- track time in tasks
- change start time and end time of tasks
- add details on how time was spent
- receive notifications when a task is in progress or when you are idle

## Screenshots
<img src="./.github/tt-projects.png" />
<img src="./.github/tt-hours.png" />
<img src="./.github/tt-edit-project.png" />

## Download
**Windows** / **MacOS** / **Linux** *(not tested)*  
   
Check the [Releases](https://github.com/1cbyc/time-tracker/releases) page for the latest version.


## Where to find app data files?
**Windows**:
```
cd C:\Users\%username%\AppData\Roaming\IsaacTimeTracker
```
**MacOS**:
```
cd ~/Library/Application\ Support/IsaacTimeTracker
```
You need to backup both `settings.json` and profile folder `profile1`. And also rest folders with profiles if you have.

## Development

### Prerequisites

- Node.js >= 16.x
- npm >= 6.x
- yarn >= 1.21.3

### Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Start the app in development mode:
```bash
yarn start
```

3. Build for production:
```bash
yarn build
```

4. Package for distribution:
```bash
yarn package
```

For more detailed information, see the [Getting Started Guide](docs/GETTING_STARTED.md) in the docs folder.

## License

MIT License - see [LICENSE](LICENSE) file for details.


