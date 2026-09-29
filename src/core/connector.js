// Standard Connector V1 - Main Connector class
// Orchestrates the canonical flow: REQUEST → COMPATIBILITY CHECK → CLASSIFY → RESOLVE → RECHECK → CONNECT OR REJECT

const InterfaceDescriptor = require('./interfaceDescriptor');
const Request = require('./request');
const Result = require('./result');
const { StandardError, ERROR_CATEGORIES } = require('./error');
const { classify } = require('./classifier');
const { resolve, ResolutionContext } = require('./resolver');
const { LIFECYCLE_STATE, LifecycleManager } = require('./lifecycle');
const { CLASSIFICATIONS } = require('./classifications');

/**
 * Standard Connector V1 instance.
 * @param {Object} options
 * @param {Object[]} options.plugins - Array of Plugin instances
 * @param {Object[]} options.adapters - Array of Adapter instances
 * @param {Object[]} options.subConnectors - Array of SubConnector instances
 */
class StandardConnector {
  constructor(options = {}) {
    this.plugins = Array.isArray(options.plugins) ? options.plugins.slice() : [];
    this.adapters = Array.isArray(options.adapters) ? options.adapters.slice() : [];
    this.subConnectors = Array.isArray(options.subConnectors) ? options.subConnectors.slice() : [];
    this.lifecycle = new LifecycleManager(`standard-connector-${Math.random().toString(36).substr(2, 9)}`);
    // Policy hooks - to be implemented
    this.hooks = {
      beforeRequest: [],
      afterClassification: [],
      beforeResolution: [],
      afterResolution: [],
      beforeRecheck: [],
      afterRecheck: [],
      onConnect: [],
      onReject: []
    };
  }

  /**
   * Register a plugin with the connector.
   * @param {Plugin} plugin
   */
  registerPlugin(plugin) {
    if (!(plugin && plugin instanceof require('./plugin'))) {
      throw new Error('Must provide a Plugin instance');
    }
    this.plugins.push(plugin);
  }

  /**
   * Register an adapter with the connector.
   * @param {Adapter} adapter
   */
  registerAdapter(adapter) {
    if (!(adapter && adapter instanceof require('./adapter'))) {
      throw new Error('Must provide an Adapter instance');
    }
    this.adapters.push(adapter);
  }

  /**
   * Register a sub-connector with the connector.
   * @param {SubConnector} subConnector
   */
  registerSubConnector(subConnector) {
    if (!(subConnector && subConnector instanceof require('./subConnector'))) {
      throw new Error('Must provide a SubConnector instance');
    }
    this.subConnectors.push(subConnector);
  }

  /**
   * Register a policy hook.
   * @param {string} hookName - One of the hook names
   * @param {Function} callback
   */
  registerHook(hookName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Hook callback must be a function');
    }
    if (!this.hooks.hasOwnProperty(hookName)) {
      throw new Error(`Unknown hook: ${hookName}`);
    }
    this.hooks[hookName].push(callback);
  }

  /**
   * Execute all registered hooks for a given hookName.
   * @param {string} hookName
   * @param {Object} context - Context to pass to hooks
   */
  async _executeHooks(hookName, context = {}) {
    if (!this.hooks[hookName]) return;
    for (const hook of this.hooks[hookName]) {
      // Assuming hooks are async; if not, they still return a promise
      await hook(context);
    }
  }

  /**
   * Process a request through the canonical flow.
   * @param {Request} request - The request to process
   * @param {InterfaceDescriptor} providerInterface - The interface of the target provider
   * @returns {Promise<Result>} A promise that resolves to a Result
   */
  async handleRequest(request, providerInterface) {
    // Lifecycle check: connector must be STARTED or ACTIVE to handle requests
    const currentState = this.lifecycle.getState();
    if (currentState !== LIFECYCLE_STATE.STARTED && currentState !== LIFECYCLE_STATE.ACTIVE) {
      return new Result({
        status: 'ERROR',
        payload: null,
        metadata: {
          error: new StandardError({
            code: 'CONNECTOR_NOT_READY',
            category: 'LIFECYCLE',
            message: `Connector is not ready to handle requests. Current state: ${currentState}`,
            recoverable: false
          })
        }
      });
    }

    try {
      // Execute beforeRequest hooks
      await this._executeHooks('beforeRequest', { request, providerInterface });

      // Step 1: COMPATIBILITY CHECK (implicit in classify)
      // Step 2: CLASSIFY
      const classification = classify(request.targetInterface, providerInterface);
      await this._executeHooks('afterClassification', { request, providerInterface, classification });

      // Step 3: RESOLVE
      const resolution = resolve(
        request,
        this.adapters,
        this.subConnectors,
        this.plugins,
        providerInterface
      );
      await this._executeHooks('beforeResolution', { request, providerInterface, classification, resolution });

      let resolved = false;
      let connection = null;
      let adaptedRequest = request;

      if (resolution) {
        // We have a resolution; we need to adapt the request accordingly
        switch (resolution.type) {
          case 'DIRECT':
            adaptedRequest = request;
            break;

          case 'ADAPTER':
            try {
              adaptedRequest = resolution.adapter.adaptRequest(request);
            } catch (err) {
              await this._executeHooks('onReject', {
                request,
                providerInterface,
                classification,
                resolution
              });

              return new Result({
                status: 'ERROR',
                payload: null,
                metadata: {
                  error: new StandardError({
                    code: 'ADAPTER_FAILURE',
                    category: ERROR_CATEGORIES[1],
                    message: err && err.message
                      ? err.message
                      : 'Adapter request adaptation failed',
                    cause: err,
                    recoverable: false
                  })
                }
              });
            }
            break;

          case 'SUB_CONNECTOR':
            try {
              connection = resolution.subConnector.connect(null);
            } catch (err) {
              await this._executeHooks('onReject', {
                request,
                providerInterface,
                classification,
                resolution
              });

              return new Result({
                status: 'ERROR',
                payload: null,
                metadata: {
                  error: new StandardError({
                    code: 'SUB_CONNECTOR_FAILURE',
                    category: ERROR_CATEGORIES[2],
                    message: err && err.message
                      ? err.message
                      : 'Sub-connector connection failed',
                    cause: err,
                    recoverable: false
                  })
                }
              });
            }

            adaptedRequest = request;
            break;

          case 'CHAIN':
            for (const step of resolution.steps) {
              switch (step.type) {
                case 'ADAPTER':
                  try {
                    adaptedRequest = step.adapter.adaptRequest(adaptedRequest);
                  } catch (err) {
                    await this._executeHooks('onReject', {
                      request,
                      providerInterface,
                      classification,
                      resolution
                    });

                    return new Result({
                      status: 'ERROR',
                      payload: null,
                      metadata: {
                        error: new StandardError({
                          code: 'ADAPTER_FAILURE',
                          category: ERROR_CATEGORIES[1],
                          message: err && err.message
                            ? err.message
                            : 'Adapter request adaptation failed',
                          cause: err,
                          recoverable: false
                        })
                      }
                    });
                  }
                  break;

                case 'SUB_CONNECTOR':
                  try {
                    connection = step.subConnector.connect(null);
                  } catch (err) {
                    await this._executeHooks('onReject', {
                      request,
                      providerInterface,
                      classification,
                      resolution
                    });

                    return new Result({
                      status: 'ERROR',
                      payload: null,
                      metadata: {
                        error: new StandardError({
                          code: 'SUB_CONNECTOR_FAILURE',
                          category: ERROR_CATEGORIES[2],
                          message: err && err.message
                            ? err.message
                            : 'Sub-connector connection failed',
                          cause: err,
                          recoverable: false
                        })
                      }
                    });
                  }
                  break;

                default:
                  await this._executeHooks('onReject', {
                    request,
                    providerInterface,
                    classification,
                    resolution
                  });

                  return new Result({
                    status: 'ERROR',
                    payload: null,
                    metadata: {
                      error: new StandardError({
                        code: 'RESOLUTION_UNSUPPORTED_STEP',
                        category: ERROR_CATEGORIES[6],
                        message: `Unsupported resolution step type: ${step.type}`,
                        recoverable: false
                      })
                    }
                  });
              }
            }
            break;

          case 'CONNECTOR':
            await this._executeHooks('onReject', {
              request,
              providerInterface,
              classification,
              resolution
            });

            return new Result({
              status: 'ERROR',
              payload: null,
              metadata: {
                error: new StandardError({
                  code: 'RESOLUTION_UNSUPPORTED_CONNECTOR',
                  category: ERROR_CATEGORIES[6],
                  message: 'Generic connector resolution is not implemented by the Core contract',
                  recoverable: false
                })
              }
            });
        }

        resolved = true;
      } else {
        // No resolution possible
        await this._executeHooks('onReject', { request, providerInterface, classification, resolution: null });
        return new Result({
          status: 'ERROR',
          payload: null,
          metadata: {
            error: new StandardError({
              code: 'RESOLUTION_NO_CANDIDATE',
              category: 'RESOLUTION',
              message: 'No resolution candidate found',
              recoverable: false
            })
          }
        });
      }

      // Step 4: RECHECK
      // Every transformation must be followed by a fresh
      // compatibility check against the interface produced by
      // that transformation.
      if (resolution) {
        if (resolution.type === 'CHAIN') {
          for (let i = 0; i < resolution.steps.length; i++) {
            const step = resolution.steps[i];
            const currentInterface = step.adaptedTargetInterface;

            const expectedNextInterface =
              i + 1 < resolution.steps.length
                ? (
                    resolution.steps[i + 1].type === 'ADAPTER'
                      ? resolution.steps[i + 1].adapter.inputInterface
                      : resolution.steps[i + 1].type === 'SUB_CONNECTOR'
                        ? resolution.steps[i + 1].subConnector.inputInterface
                        : resolution.steps[i + 1].type === 'CONNECTOR'
                          ? resolution.steps[i + 1].plugin.interface
                          : providerInterface
                  )
                : providerInterface;

            const recheckCompatible =
              currentInterface.isCompatibleWith(expectedNextInterface);

            await this._executeHooks('beforeRecheck', {
              request: adaptedRequest,
              providerInterface,
              classification,
              resolution,
              adaptedTargetInterface: currentInterface,
              recheckCompatible
            });

            if (!recheckCompatible) {
              await this._executeHooks('onReject', {
                request,
                providerInterface,
                classification,
                resolution
              });

              return new Result({
                status: 'ERROR',
                payload: null,
                metadata: {
                  error: new StandardError({
                    code: 'RESOLUTION_RECHECK_FAILED',
                    category: 'RESOLUTION',
                    message: 'Compatibility recheck failed after transformation',
                    recoverable: false
                  })
                }
              });
            }
          }
        } else {
          let adaptedTargetInterface;

          switch (resolution.type) {
            case 'DIRECT':
              adaptedTargetInterface = providerInterface;
              break;

            case 'ADAPTER':
              adaptedTargetInterface = resolution.adapter.outputInterface;
              break;

            case 'SUB_CONNECTOR':
              adaptedTargetInterface = resolution.subConnector.outputInterface;
              break;

            case 'CONNECTOR':
              adaptedTargetInterface = resolution.plugin.interface;
              break;
          }

          const recheckCompatible =
            adaptedTargetInterface.isCompatibleWith(providerInterface);

          await this._executeHooks('beforeRecheck', {
            request,
            providerInterface,
            classification,
            resolution,
            adaptedTargetInterface,
            recheckCompatible
          });

          if (!recheckCompatible) {
            await this._executeHooks('onReject', {
              request,
              providerInterface,
              classification,
              resolution
            });

            return new Result({
              status: 'ERROR',
              payload: null,
              metadata: {
                error: new StandardError({
                  code: 'RESOLUTION_RECHECK_FAILED',
                  category: 'RESOLUTION',
                  message: 'Compatibility recheck failed after transformation',
                  recoverable: false
                })
              }
            });
          }
        }
      }

      // Step 5: CONNECT OR REJECT
      // If we have a resolution and recheck passed, we attempt to connect.
      // For simplicity, we'll assume the connection is already established (for sub-connector)
      // or that the plugin/adapter will handle the actual request execution.
      // We'll simulate a successful operation.
      await this._executeHooks('onConnect', { request, providerInterface, classification, resolution, adaptedRequest, connection });

      // In a real implementation, we would now execute the operation via the appropriate means
      // and return the result. For now, we'll return a successful result.
      return new Result({
        status: 'OK',
        payload: { message: 'Operation successful (simulated)' },
        metadata: {
          connectorVersion: '1.0.0',
          classification,
          resolutionType: resolution ? resolution.type : null
        }
      });
    } catch (err) {
      // Handle any unexpected errors
      if (err instanceof StandardError) {
        return new Result({
          status: 'ERROR',
          payload: null,
          metadata: { error: err }
        });
      }
      return new Result({
        status: 'ERROR',
        payload: null,
        metadata: {
          error: new StandardError({
            code: 'INTERNAL_ERROR',
            category: 'UNEXPECTED',
            message: err.message || 'Unknown error',
            cause: err,
            recoverable: false
          })
        }
      });
    }
  }

  /**
   * Start the connector. Walks the lifecycle from its current state through
   * to ACTIVE (REGISTERED -> INITIALIZED -> STARTED -> ACTIVE) so callers
   * don't need to know about the intermediate lifecycle steps.
   */
  start() {
    if (this.lifecycle.getState() === LIFECYCLE_STATE.REGISTERED) {
      this.lifecycle.register();
    }
    if (this.lifecycle.getState() === LIFECYCLE_STATE.INITIALIZED) {
      this.lifecycle.initialize();
    }
    if (this.lifecycle.getState() === LIFECYCLE_STATE.STARTED) {
      this.lifecycle.start();
    }
  }

  /**
   * Stop the connector.
   */
  stop() {
    this.lifecycle.stop();
  }

  /**
   * Get the current lifecycle state.
   * @returns {string}
   */
  getState() {
    return this.lifecycle.getState();
  }
}

module.exports = StandardConnector;