// Resolver for Standard Connector V1
// Implements bounded, deterministic resolution with cycle detection

const { CLASSIFICATIONS } = require('./classifications');
const { classify } = require('./classifier');

class ResolutionContext {
  constructor(maxDepth = 10) {
    this.maxDepth = maxDepth;
    this.visited = new Set();
    this.depth = 0;
  }

  static getStateKey(targetInterface, currentInterface, options = {}) {
    return JSON.stringify({
      target: targetInterface.toKey(),
      current: currentInterface.toKey(),
      options
    });
  }

  enter(targetInterface, currentInterface, options = {}) {
    if (this.depth >= this.maxDepth) {
      return false;
    }

    const key = ResolutionContext.getStateKey(
      targetInterface,
      currentInterface,
      options
    );

    if (this.visited.has(key)) {
      return false;
    }

    this.visited.add(key);
    this.depth++;
    return true;
  }

  leave() {
    this.depth--;
  }
}

function resolve(
  request,
  adapters,
  subConnectors,
  plugins,
  providerInterface,
  context = new ResolutionContext()
) {
  if (!request || !request.targetInterface || typeof request.targetInterface.toKey !== 'function') {
    throw new Error('resolve requires a valid request with targetInterface');
  }

  if (!providerInterface || typeof providerInterface.toKey !== 'function') {
    throw new Error('resolve requires a valid providerInterface');
  }

  const safeAdapters = Array.isArray(adapters) ? adapters : [];
  const safeSubConnectors = Array.isArray(subConnectors) ? subConnectors : [];
  const safePlugins = Array.isArray(plugins) ? plugins : [];

  const options = {
    adapters: safeAdapters.length,
    subConnectors: safeSubConnectors.length,
    plugins: safePlugins.length
  };

  function directResolution(target, provider) {
    const classification = classify(target, provider);

    if (classification === CLASSIFICATIONS.DIRECT_MATCH) {
      return {
        type: 'DIRECT',
        providerInterface: provider,
        adaptedTargetInterface: provider
      };
    }

    return null;
  }

  function candidatesFor(currentInterface) {
    const candidates = [];

    // Adapters are selected by whether they can consume the
    // interface currently available in the resolution chain.
    for (const adapter of safeAdapters) {
      if (
        adapter &&
        adapter.inputInterface &&
        adapter.outputInterface &&
        currentInterface.isCompatibleWith(adapter.inputInterface)
      ) {
        candidates.push({
          type: 'ADAPTER',
          object: adapter,
          nextInterface: adapter.outputInterface
        });
      }
    }

    // Sub-connectors follow the same transformation rule.
    for (const subConnector of safeSubConnectors) {
      if (
        subConnector &&
        subConnector.inputInterface &&
        subConnector.outputInterface &&
        currentInterface.isCompatibleWith(subConnector.inputInterface)
      ) {
        candidates.push({
          type: 'SUB_CONNECTOR',
          object: subConnector,
          nextInterface: subConnector.outputInterface
        });
      }
    }

    // Plugins expose an interface rather than an input/output pair.
    // They can terminate resolution when their interface is compatible
    // with the interface currently available.
    for (const plugin of safePlugins) {
      if (
        plugin &&
        plugin.interface &&
        currentInterface.isCompatibleWith(plugin.interface)
      ) {
        candidates.push({
          type: 'CONNECTOR',
          object: plugin,
          nextInterface: plugin.interface
        });
      }
    }

    // Deterministic candidate selection:
    // order by the canonical output interface key, then by transformation type.
    candidates.sort((a, b) => {
      const interfaceCompare = a.nextInterface.toKey().localeCompare(
        b.nextInterface.toKey()
      );

      if (interfaceCompare !== 0) {
        return interfaceCompare;
      }

      return a.type.localeCompare(b.type);
    });

    return candidates;
  }

  function makeStep(candidate, provider) {
    if (candidate.type === 'ADAPTER') {
      return {
        type: 'ADAPTER',
        adapter: candidate.object,
        adaptedTargetInterface: candidate.nextInterface,
        providerInterface: provider
      };
    }

    if (candidate.type === 'SUB_CONNECTOR') {
      return {
        type: 'SUB_CONNECTOR',
        subConnector: candidate.object,
        adaptedTargetInterface: candidate.nextInterface,
        providerInterface: provider
      };
    }

    return {
      type: 'CONNECTOR',
      plugin: candidate.object,
      adaptedTargetInterface: candidate.nextInterface,
      providerInterface: provider
    };
  }

  function walk(currentInterface, steps) {
    const direct = directResolution(currentInterface, providerInterface);

    if (direct) {
      if (steps.length === 0) {
        return direct;
      }

      return {
        type: 'CHAIN',
        steps,
        providerInterface
      };
    }

    if (!context.enter(request.targetInterface, currentInterface, options)) {
      return null;
    }

    try {
      const candidates = candidatesFor(currentInterface);

      for (const candidate of candidates) {
        const step = makeStep(candidate, providerInterface);

        // Every transformation must produce a fresh compatibility state.
        const nextInterface = candidate.nextInterface;

        if (nextInterface.toKey() === currentInterface.toKey()) {
          continue;
        }

        const nextDirect = directResolution(nextInterface, providerInterface);

        if (nextDirect) {
          const finalSteps = steps.concat(step);

          if (finalSteps.length === 1) {
            return finalSteps[0];
          }

          return {
            type: 'CHAIN',
            steps: finalSteps,
            providerInterface
          };
        }

        const result = walk(nextInterface, steps.concat(step));

        if (result) {
          return result;
        }
      }

      return null;
    } finally {
      context.leave();
    }
  }

  return walk(request.targetInterface, []);
}

module.exports = {
  resolve,
  ResolutionContext
};
