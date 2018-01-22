var Promise     = require('bluebird')
  , _           = require('lodash')
  , CronTabJob  = require('crontab/lib/CronJob')
  , later       = require('later')
  ;

function parse(text = '', options = {}, cb) {
  let { limit } = options;

  return Promise
          .try(() => {
            return _
                    .chain(text.split('\n'))
                    .reject(_.isEmpty)
                    .take(limit)
                    .value()
                    ;
          })
          .map((line) => {
            return Promise
                    .try(() => new CronTabJob(line))
                    .catch(() => {})
                    .then((job) => {
                      if (job && job.isValid()) {
                        return {
                            cron      : _.map([ job.minute(), job.hour(), job.dom(), job.month(), job.dow() ], (t) => t.toString()).join(' ')
                          , command   : job.command()
                        };
                      }
                    });
          })
          .then((jobs) => {
            return _.chain(jobs)
                    .compact()
                    .map(({ cron, command, comment }) => {
                      return { cron, command, comment };
                    })
                    .value();
          })
          .asCallback(cb);
}

var cache = {};

function next(cron, after) {
  var exp = cache[cron];
  if (!exp) {
    exp = cache[cron] = later.parse.cron(cron);
  }

  var at = later.schedule(exp).next(1, after).getTime();

  // trim ms because if we round trip it, we might end up with error from later
  // return Math.round(at/6000) * 6000;
  return at;
}

module.exports = {
    parse : parse
  , next  : next
};
