/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
module.exports = process.env.ITIER_CLIENT_COV ?
  require('./lib-cov/itier-client.js')
  :
  require('./lib/itier-client.js');
