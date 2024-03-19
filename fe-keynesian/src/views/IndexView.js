/* eslint-disable */

import React from 'react'
import { createScope, map, transformProxies } from './helpers'

const scripts = [
  { loading: fetch("https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=65f8d5e4ed1fa366d79954b8").then(body => body.text()), isAsync: false },
  { loading: fetch("js/webflow.js").then(body => body.text()), isAsync: false },
]

let Controller

class IndexView extends React.Component {
  static get Controller() {
    if (Controller) return Controller

    try {
      Controller = require('../controllers/IndexController')
      Controller = Controller.default || Controller

      return Controller
    }
    catch (e) {
      if (e.code == 'MODULE_NOT_FOUND') {
        Controller = IndexView

        return Controller
      }

      throw e
    }
  }

  componentDidMount() {
    const htmlEl = document.querySelector('html')
    htmlEl.dataset['wfPage'] = '65f8d5e4ed1fa366d79954e6'
    htmlEl.dataset['wfSite'] = '65f8d5e4ed1fa366d79954b8'

    scripts.concat(null).reduce((active, next) => Promise.resolve(active).then((active) => {
      const loading = active.loading.then((script) => {
        new Function(`
          with (this) {
            eval(arguments[0])
          }
        `).call(window, script)

        return next
      })

      return active.isAsync ? next : loading
    }))
  }

  render() {
    const proxies = IndexView.Controller !== IndexView ? transformProxies(this.props.children) : {

    }

    return (
      <span>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url(/css/normalize.css);
          @import url(/css/webflow.css);
          @import url(/css/melee.webflow.css);
        ` }} />
        <span className="af-view">
          <div className="af-class-body">
            <div className="af-class-game-container">
              <div className="af-class-game-header">
                <div className="af-class-game-title">
                  <div className="af-class-h1">Keynesian contest </div>
                  <div className="af-class-p_body">You are rewarded for selecting the most popular faces among all participants.</div>
                </div>
                <div className="af-class-game-stats">
                  <div className="af-class-typehead">
                    <div className="af-class-p_body">Total Pot</div>
                    <div className="af-class-h2">$40,000,000</div>
                  </div>
                  <div className="af-class-typehead">
                    <div className="af-class-p_body">Time to reveal</div>
                    <div className="af-class-h2">12:23:41</div>
                  </div>
                </div>
              </div>
              <div className="af-class-bet-input">
                <div className="af-class-form-block w-form">
                  <form id="wf-form-amount" name="wf-form-amount" data-name="amount" method="get" className="af-class-form" data-wf-page-id="65f8d5e4ed1fa366d79954e6" data-wf-element-id="e7861668-ca28-fc22-0336-d64cfa723b73"><input className="af-class-text-field w-input" maxLength={256} name="amount" data-name="amount" placeholder="Amount" type="number" id="amount" /><input type="submit" data-wait="Please wait..." className="af-class-submit-button w-button" defaultValue="Bet" /></form>
                  <div className="af-class-success-message w-form-done">
                    <div>Thank you! Your submission has been received!</div>
                  </div>
                  <div className="af-class-error-message w-form-fail">
                    <div>Oops! Something went wrong while submitting the form.</div>
                  </div>
                </div>
              </div>
              <div className="w-layout-vflex af-class-flex-block">
                <div className="af-class-p_body">Select 4 faces to bet</div>
                <div className="af-class-selection-grid">
                  <div className="af-class-item af-class-selected"><img src="images/img.png" loading="lazy" width={211} height={212} alt className="af-class-img" /></div>
                  <div className="af-class-item"><img src="images/img_1.png" loading="lazy" width={211} height={212} alt className="af-class-img" /></div>
                  <div className="af-class-item"><img src="images/img_2.png" loading="lazy" width={211} height={212} alt className="af-class-img" /></div>
                  <div className="af-class-item"><img src="images/img_3.png" loading="lazy" width={211} height={212} alt className="af-class-img" /></div>
                  <div className="af-class-item"><img src="images/img_4.png" loading="lazy" width={211} height={211} alt className="af-class-img" /></div>
                  <div className="af-class-item"><img src="images/img_5.png" loading="lazy" width={211} height={211} alt className="af-class-img" /></div>
                  <div className="af-class-item"><img src="images/img_6.png" loading="lazy" width={211} height={211} alt className="af-class-img" /></div>
                  <div className="af-class-item"><img src="images/img_7.png" loading="lazy" width={211} height={211} alt className="af-class-img" /></div>
                </div>
              </div>
            </div>
          </div>
        </span>
      </span>
    )
  }
}

export default IndexView

/* eslint-enable */