# Tipue Search Lite

Tipue Search Lite is a vanilla javascript fork of the popular Tipue Search
project with a simplified feature set. No jQuery is required.

Tipue Search Lite is most commonly used as a search engine for static websites.

## Features

Differences from Tipue Search 7.1

* Dropped dependency on jQuery
* Search algorithm uses the [KMP Algorithm](https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm)
* Removed image support
* Removed "related searches"
* Removed "word replacement"
* Removed pagination of results
* Linting and code simplification


## Search Index

Several static site generators support building the index for Tipue Search,
including Pelican ([pelican-plugins/tipue-search](https://github.com/pelican-plugins/tipue-search))
and Jekyll ([jekyll-tipue-search](https://github.com/jekylltools/jekyll-tipue-search)).

[StaticIndexer](https://github.com/MaxBittker/StaticIndexer) can be used to
generate the index independent of a static site generator.


## Examples

A demo is available under the `demo/` folder. An example of Tipue Search Lite
integrated with a Pelican website is available at [https://github.com/psychoinformatics-de/studyforrest-www](psychoinformatics-de/studyforrest-www).


## Code History

This fork was originally a component of a larger, internal project. No effort
was made to import the original code history.

When the original Tipue project ended, it was decided to split this code into
its own repository and share it publicly. For this reason, there is no history
further back than the initial import of the unminified 7.1 codebase.


## Copyright

Tipue Search was originally developed by Tipue and released under the MIT
license. Others contributed developments to upstream (including Michael Milette,
for version 6.0).

Tipue Search Lite was released in 2020.

See the LICENSE file and code history for more information.
