PlayerCardsModel = class PlayerCardsModel extends ReactiveDictModel {
  static data_source(game_id) {
    return PlayerCards[game_id]
  }

  static insert(record) {
    return super.insert()
  }

  static find(game_id) {
    return _.mapValues(this.data_source(game_id).all())
  }

  static findOne(game_id, player_id) {
    return this.data_source(game_id).get(player_id)
  }

  static insert(record) {
    this.data_source(record.game_id).set(record.player_id, _.merge(record, {
      _id: record.player_id,
      discard: [],
      playing: [],
      in_play: [],
      revealed: [],
      duration: [],
      haven: [],
      native_village: [],
      island: [],
      pirate_ship_coins: 0,
      victory_tokens: 0,
      last_turn_gained_cards: [],
      possession_trash: []
    }))
    return record.player_id
  }

  static update(game_id, record) {
    return this.data_source(game_id).set(record.player_id, record)
  }

  static remove(game_id, player_id) {
    if (id) {
      this.data_source(game_id).delete(player_id)
    } else {
      return this.data_source(game_id).clear()
    }
  }
}