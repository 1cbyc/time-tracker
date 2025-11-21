import { EChannels } from '../../main/EChannels';

const fs = require('fs');
const path = require('path');
import { ipcRenderer } from 'electron';

import FsHelper from '../../helpers/FsHelper';
import PromiseQueue from '../../helpers/PromiseQueueHellper';

const APP_DIR =
  process.env.NODE_ENV === 'development'
    ? 'IsaacTimeTracker_test'
    : 'IsaacTimeTracker';

let _appDataPath: string = '';

export default abstract class AbstractFileRepository<T = any> {
  dirWithProfileData: string = 'profile1';
  fileName: string = 'defaultFileName.json';
  saveInRoot: boolean = false;

  writeFileQueue = new PromiseQueue();

  private get logPrefix() {
    const filePath = !this.saveInRoot ? this.dirWithProfileData : '';
    return `FileRepository [${filePath}/${this.fileName}]:`;
  }

  static get appDataFolder() {
    if (_appDataPath) {
      return _appDataPath;
    }
    _appDataPath = ipcRenderer.sendSync(EChannels.GetPathUserData);
    return _appDataPath;
  }

  private get destFolder() {
    const pathItems = [AbstractFileRepository.appDataFolder, APP_DIR];
    if (!this.saveInRoot) {
      pathItems.push(this.dirWithProfileData);
    }
    return path.join(...pathItems);
  }

  private get filePath() {
    return path.join(this.destFolder, this.fileName);
  }

  public setProfile(profile: string) {
    this.dirWithProfileData = profile;
  }

  public restore(defaultValue: T): T {
    console.log(`${this.logPrefix} restore ${this.filePath}`);
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, { encoding: 'utf-8' });
        return JSON.parse(data);
      } catch (error) {
        // Backup corrupted file and return default value
        const backupPath = `${this.filePath}.corrupted.${Date.now()}`;
        console.error(
          `${this.logPrefix} parse error, backing up corrupted file to ${backupPath}`,
          error
        );
        try {
          fs.copyFileSync(this.filePath, backupPath);
          console.log(`${this.logPrefix} corrupted file backed up successfully`);
        } catch (backupError) {
          console.error(
            `${this.logPrefix} failed to backup corrupted file`,
            backupError
          );
        }
        return defaultValue;
      }
    }
    return defaultValue;
  }

  public save(data: T) {
    FsHelper.mkdirIfNotExists(this.destFolder);
    this.writeFileQueue.add(() => {
      console.log(`${this.logPrefix} save`);
      return FsHelper.writeFile(this.filePath, data).catch(() => {
        console.error(`${this.logPrefix} can't save file '${this.filePath}'`);
      });
    });
    this.writeFileQueue.execute();
  }
}
