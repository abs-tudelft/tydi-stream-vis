# Tydi stream visualizer tool

Web application to help people understand Tydi concepts by providing visual representations of the data structure and stream transfers. Check out the [Understanding Tydi guide](https://abs-tudelft.github.io/docs/tydi/what-is-tydi/) for a gentle introduction into Tydi.

The visualization and building of the Tydi structure is handled by [Blockly](https://developers.google.com/blockly).

Each stream in the Tydi structure is broken out into a physical stream with a table of the 

For increased understanding of how a Tydi structure is built and how data transfer works, the tool allows loading your own data. The process works as follows.

1. Insert the `json` data
2. The data's data schema is extracted
3. A Tydi structure is created in the Blockly canvas based on this data schema
    - Each element is given a path mapping to the original data
    - Nullable elements are converted to `Union`s
4. Each stream in the schema is split into a separate physical stream and data packets are constructed based on the input data
5. Stream transfers are visualized using these data packets

## Features
- [x] Generate Tydi structure based on input data, keeping track of the mapping
    - [x] Map timestamp strings to integers
    - [x] Make nullable fields into unions
    - [ ] Differentiate between integers and floats and control *default* data bit-widths for these
- [x] Generate interface code in various HDLs based on the Tydi structure
- [x] Visualize stream transfers using original data
    - [ ] Selectable stream protocol complexity
    - [ ] Show data packing into stream bitvectors
    - [ ] Show clear relationships between streams
    - [ ] Show table with all streams to highlight natural ordering
- [ ] Generate mock data for Tydi structures created by hand
- [ ] Load in `vcd` file to visualize transfers in simulation data

## Limitations

#### Inaccuracies
Currently there are still some inaccuracies in the app with regard to the Tydi spec or implementation libraries.

#### Automatic mapping of the data structure
A set of semi-structured data like in a JSON file can be mapped onto a fixed structure in many ways. This tool cannot possibly know what the best mapping would be for a specific use-case. This is most prevalent in mapping objects and their properties. When comparing objects `{a: 1, b: 2}` and `{c: 3, d: 4}` it is unknown whether these are two distinct objects that are toggled between or instances of an object with all nullable fields `{ a?, b?, c?, d? }`. Therefore, the tool assumes, when comparing different objects, that each difference means a nullable field, not a different object or a combination of.

#### Unions
`Union`s are complicated because the data _structure_ they represent is selected by the `tag` field and based on the data that one wants to transfer.As such it not yet supported for data packet creation and visualization.

`Union`s are automatically created to emulate nullable fields in an object. These are converted to a `Union` with as fields the original structure and a `Null`.

## Contributing

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Recommended IDE Setup

The people from Vue recommend [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur). The Vue integration in Jetbrains IDE's is also nice.

#### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.