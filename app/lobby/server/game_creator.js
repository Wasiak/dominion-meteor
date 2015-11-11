GameCreator = class GameCreator {

  constructor(players, cards) {
    this.players = players
    this.cards = cards
  }

  create() {
    let game_id = this.create_game()
    this.game = Games.findOne(game_id)
    this.create_turn()
    this.start_game_log()
    this.set_up_players()
    this.assign_game_to_players()
    Games.update(this.game._id, this.game)
  }

  create_game() {
    let cards = this.game_cards()
    return Games.insert({
      players: _.shuffle(this.players),
      cards: cards,
      trash: [],
      log: [],
      turn_number: 1,
      duchess: this.has_duchess(cards)
    })
  }

  start_game_log() {
    let turn_order =  _.map(this.game.players, function(player) {
      return player.username
    })

    this.game.log = [
      `Turn Order is: ${turn_order.join(', ')}`,
      `<strong>- ${this.game.turn.player.username}'s turn 1 -</strong>`
    ]
  }

  create_turn() {
    this.game.turn = {
      player: _.first(this.game.players),
      actions: 1,
      buys: 1,
      coins: 0,
      potions: 0,
      phase: 'action',
      gained_cards: [],
      last_player_gained_cards: []
    }
  }

  set_up_players() {
    this.game.players = _.map(this.players, (player) => {
      this.create_player_cards(player)
      player = this.add_victory_tokens(player)
      return player
    })
  }

  add_victory_tokens(player) {
    player.victory_tokens = 0
    return player
  }

  create_player_cards(player) {
    let copper = new Copper()
    let estate = new Estate()

    coppers = _.times(7, function() { return copper.to_h() })
    estates = _.times(3, function() { return estate.to_h() })

    deck = _.shuffle(coppers.concat(estates))
    hand = _.take(deck, 5)
    deck = _.drop(deck, 5)

    PlayerCards.insert({
      player_id: player._id,
      game_id: this.game._id,
      username: player.username,
      deck: deck,
      discard: [],
      playing: [],
      in_play: [],
      revealed: [],
      duration: [],
      haven: [],
      native_village: [],
      island: [],
      hand: hand,
      pirate_ship_coins: 0
    })
  }

  assign_game_to_players() {
    _.each(this.players, (player) => {
      Meteor.users.update(player._id, {
        $set: {current_game: this.game._id}
      })
    })
  }

  game_cards() {
    return this.kingdom_cards().concat(this.common_cards())
  }

  kingdom_cards() {
    return _.chain(this.cards).map((card) => {
      return this.game_card(card, 'kingdom')
    }).sortBy(function(card) {
      return -(card.top_card.coin_cost + (card.top_card.potion_cost * .1))
    }).value()
  }

  common_cards() {
    let cards = _.map(this.common_card_names(), function(card_name) {
      return ClassCreator.create(card_name).to_h()
    })

    return _.map(cards, (card) => {
      return this.game_card(card, 'common')
    })
  }

  common_card_names() {
    return this.victory_card_names().concat(this.treasure_card_names()).concat(this.miscellaneous_card_names())
  }

  victory_card_names() {
    return ['Province','Duchy','Estate']
  }

  treasure_card_names() {
    return ['Gold','Silver','Copper']
  }

  miscellaneous_card_names() {
    return ['Curse']
  }

  game_card(card, source) {
    let card_stack = this.create_card_stack(card)
    return {
      name: card.name,
      count: _.size(card_stack),
      embargos: 0,
      top_card: _.first(card_stack),
      stack: card_stack,
      source: source
    }
  }

  create_card_stack(card) {
    return _.times(this.stack_size(card), function(counter) {
      return card
    })
  }

  stack_size(card) {
    if (_.contains(card.types, 'victory')) {
      return _.size(this.players) < 3 ? 8 : 12
    } else if (card.name === 'Curse') {
      return _.size(this.players) === 1 ? 10 : _.size(this.players) * 10 - 10
    } else if (card.name === 'Copper') {
      return 60
    } else if (card.name === 'Silver') {
      return 40
    } else if (card.name === 'Gold') {
      return 30
    } else {
      return 10
    }
  }

  has_duchess(cards) {
    return _.find(cards, function(card) {
      return card.name === 'Duchess'
    }) !== -1
  }

}
