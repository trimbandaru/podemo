import cds from '@sap/cds'

// ------------------------------------------------------------------
// SERVER LIFECYCLE - these events fire once, in this order, at startup
// ------------------------------------------------------------------
const LOG = cds.log('server')

cds.on('bootstrap', app => LOG.info('1. bootstrap  - express app created (add your own middlewares here)'))
cds.on('loaded', model => LOG.info('2. loaded     - CDS model loaded with', Object.keys(model.definitions).length, 'definitions'))
cds.on('connect', service => LOG.info('3. connect    - connected to', service.name))
cds.on('serving', service => LOG.info('4. serving    -', service.name, 'is being served at', service.path))
cds.on('served', services => LOG.info('5. served     - all services are ready:', Object.keys(services).join(', ')))
cds.on('listening', ({ url }) => LOG.info('6. listening  - server is up at', url))
cds.on('shutdown', () => LOG.info('7. shutdown   - server is stopping'))

export default cds.server // keep the standard CAP server
