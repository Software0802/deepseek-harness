/**
 * electron-builder afterPack hook: copy the assembled host tree and tray
 * icons into the packaged app's resources. Done here (instead of
 * extraResources) because the host tree is ~300MB of node_modules and
 * electron-builder's file matchers are unreliable at that scale.
 */
const { cp, access } = require('node:fs/promises')
const { existsSync } = require('node:fs')
const path = require('node:path')

exports.default = async function afterPack(context) {
  const { appOutDir, packager } = context
  const projectDir = packager.projectDir
  const resourcesOut = path.join(appOutDir, 'resources')

  const hostIn = path.join(projectDir, 'resources', 'host')
  const hostOut = path.join(resourcesOut, 'host')
  await cp(hostIn, hostOut, { recursive: true, force: true })
  await access(path.join(hostOut, 'node_modules', '@deepseek-ai', 'dsh-llm-pi-ai', 'lib', 'index.js'))

  const updaterOnDisk = path.join(projectDir, 'app', 'node_modules', 'electron-updater', 'package.json')
  if (!existsSync(updaterOnDisk)) {
    throw new Error('afterPack: staged app missing electron-updater; stage-app.ps1 did not run')
  }

  const trayIn = path.join(projectDir, 'resources', 'desktop-resources')
  if (existsSync(trayIn)) {
    await cp(trayIn, path.join(resourcesOut, 'desktop-resources'), { recursive: true, force: true })
  }
}
