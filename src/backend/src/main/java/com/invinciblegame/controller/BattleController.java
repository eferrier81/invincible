package com.invinciblegame.controller;

import com.invinciblegame.dto.request.BattleActionRequest;
import com.invinciblegame.dto.request.ClaimRewardRequest;
import com.invinciblegame.dto.request.StartBattleRequest;
import com.invinciblegame.dto.response.BattleResponse;
import com.invinciblegame.service.BattleService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/battles")
public class BattleController {
    private final BattleService battleService;

    public BattleController(BattleService battleService) {
        this.battleService = battleService;
    }

    @PostMapping("/start")
    public BattleResponse start(@Valid @RequestBody StartBattleRequest request) {
        return battleService.start(request);
    }

    @PostMapping("/{id}/action")
    public BattleResponse action(@PathVariable Long id, @Valid @RequestBody BattleActionRequest request) {
        return battleService.action(id, request);
    }

    @GetMapping("/{id}")
    public BattleResponse getBattle(@PathVariable Long id) {
        return battleService.getById(id);
    }

    @GetMapping("/history")
    public List<BattleResponse> history() {
        return battleService.history();
    }

    @PostMapping("/{id}/claim-reward")
    public BattleResponse claimReward(@PathVariable Long id, @Valid @RequestBody ClaimRewardRequest request) {
        return battleService.claimReward(id, request);
    }
}
