const { app } = require('electron')

app.whenReady().then(() => {
  console.log('modules', process.versions.modules)
  try {
    const Database = require('better-sqlite3')
    const db = new Database(':memory:')
    console.log('OK', db.prepare('select 1 as ok').get())
    db.close()
  } catch (err) {
    console.error('FAIL', err)
  }
  app.quit()
})
