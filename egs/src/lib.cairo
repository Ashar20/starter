// Contagion EGS Minigame — Embeddable Game Standard
// Exposes score and game_over for a token. Client calls report_result(token_id, score) when a game ends.

use starknet::ContractAddress;
use core::byte_array::ByteArray;

#[starknet::interface]
trait IContagionEgs<TContractState> {
    /// One-time setup: set minigame token address and register with the EGS MinigameRegistry.
    fn initializer(
        ref self: TContractState,
        game_creator: ContractAddress,
        game_name: ByteArray,
        game_description: ByteArray,
        game_developer: ByteArray,
        game_publisher: ByteArray,
        game_genre: ByteArray,
        game_image: ByteArray,
        game_color: Option<ByteArray>,
        client_url: Option<ByteArray>,
        renderer_address: Option<ContractAddress>,
        settings_address: Option<ContractAddress>,
        objectives_address: Option<ContractAddress>,
        minigame_token_address: ContractAddress,
        royalty_fraction: Option<u128>,
        skills_address: Option<ContractAddress>,
        version: u64,
    );
    /// Called when a Contagion game ends (client submits signed tx). Sets score and game_over for token_id.
    fn report_result(ref self: TContractState, token_id: felt252, score: u64);
}

#[starknet::contract]
mod ContagionEgs {
    use game_components_embeddable_game_standard::minigame::interface::{IMINIGAME_ID, IMinigameTokenData};
    use game_components_embeddable_game_standard::minigame::minigame_component::MinigameComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_introspection::src5::SRC5Component::InternalTrait;
    use starknet::storage::{StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::ContractAddress;

    component!(path: MinigameComponent, storage: minigame, event: MinigameEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl MinigameImpl = MinigameComponent::MinigameImpl<ContractState>;
    impl MinigameInternalImpl = MinigameComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        minigame: MinigameComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        scores: starknet::storage::Map<felt252, u64>,
        game_overs: starknet::storage::Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MinigameEvent: MinigameComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.src5.register_interface(IMINIGAME_ID);
    }

    #[abi(embed_v0)]
    impl MinigameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: felt252) -> u64 {
            self.scores.read(token_id)
        }

        fn game_over(self: @ContractState, token_id: felt252) -> bool {
            self.game_overs.read(token_id)
        }

        fn score_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<u64> {
            let mut results = array![];
            for token_id in token_ids {
                results.append(self.scores.read(*token_id));
            };
            results
        }

        fn game_over_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<bool> {
            let mut results = array![];
            for token_id in token_ids {
                results.append(self.game_overs.read(*token_id));
            };
            results
        }
    }

    #[abi(embed_v0)]
    impl ContagionEgsImpl of super::IContagionEgs<ContractState> {
        fn initializer(
            ref self: ContractState,
            game_creator: ContractAddress,
            game_name: ByteArray,
            game_description: ByteArray,
            game_developer: ByteArray,
            game_publisher: ByteArray,
            game_genre: ByteArray,
            game_image: ByteArray,
            game_color: Option<ByteArray>,
            client_url: Option<ByteArray>,
            renderer_address: Option<ContractAddress>,
            settings_address: Option<ContractAddress>,
            objectives_address: Option<ContractAddress>,
            minigame_token_address: ContractAddress,
            royalty_fraction: Option<u128>,
            skills_address: Option<ContractAddress>,
            version: u64,
        ) {
            self.minigame.initializer(
                game_creator,
                game_name,
                game_description,
                game_developer,
                game_publisher,
                game_genre,
                game_image,
                game_color,
                client_url,
                renderer_address,
                settings_address,
                objectives_address,
                minigame_token_address,
                royalty_fraction,
                skills_address,
                version,
            );
        }

        fn report_result(ref self: ContractState, token_id: felt252, score: u64) {
            self.minigame.assert_token_ownership(token_id);
            self.minigame.pre_action(token_id);

            self.scores.write(token_id, score);
            self.game_overs.write(token_id, true);

            self.minigame.post_action(token_id);
        }
    }
}
